import fs from "node:fs/promises";
import path from "node:path";
import { parse } from "@babel/parser";
import traverse from "@babel/traverse";
import type { NodePath } from "@babel/traverse";
import type {
  ClassMethod,
  ClassPrivateMethod,
  Node,
  ObjectMethod,
  ObjectProperty
} from "@babel/types";
import { collectCandidateFiles, resolveRepositoryRoot } from "./file-system";
import { ParsedFile, ParsedProject, ParsedRoom } from "../types";

const MAX_FILE_SIZE_BYTES = 512_000;

const LANGUAGE_BY_EXTENSION: Record<string, string> = {
  ".c": "c",
  ".cc": "cpp",
  ".cpp": "cpp",
  ".cs": "csharp",
  ".cts": "typescript",
  ".cjs": "javascript",
  ".go": "go",
  ".h": "c",
  ".hpp": "cpp",
  ".java": "java",
  ".js": "javascript",
  ".jsx": "javascript",
  ".json": "json",
  ".md": "markdown",
  ".mjs": "javascript",
  ".mts": "typescript",
  ".php": "php",
  ".ps1": "powershell",
  ".py": "python",
  ".rb": "ruby",
  ".rs": "rust",
  ".sql": "sql",
  ".svg": "svg",
  ".ts": "typescript",
  ".tsx": "typescript",
  ".xml": "xml",
  ".yaml": "yaml",
  ".yml": "yaml"
};

const COMMENT_PREFIXES: Record<string, string[]> = {
  c: ["//", "/*", "*"],
  cpp: ["//", "/*", "*"],
  csharp: ["//", "/*", "*"],
  go: ["//", "/*", "*"],
  java: ["//", "/*", "*"],
  javascript: ["//", "/*", "*"],
  markdown: ["<!--"],
  php: ["//", "#", "/*", "*"],
  powershell: ["#"],
  python: ["#"],
  ruby: ["#"],
  rust: ["//", "/*", "*"],
  sql: ["--"],
  typescript: ["//", "/*", "*"],
  xml: ["<!--"],
  yaml: ["#"]
};

const CONTROL_KEYWORDS = new Set([
  "catch",
  "do",
  "else",
  "for",
  "if",
  "match",
  "switch",
  "try",
  "while"
]);

const normalizePath = (value: string): string => value.split(path.sep).join("/");

const countLogicalLines = (content: string): number => {
  return content.split(/\r?\n/).filter((line) => line.trim().length > 0).length;
};

const countCommentLines = (content: string, language: string): number => {
  const prefixes = COMMENT_PREFIXES[language] ?? ["//", "#", "--"];
  return content
    .split(/\r?\n/)
    .filter((line) => prefixes.some((prefix) => line.trimStart().startsWith(prefix))).length;
};

const estimateBranchingSignals = (content: string): number => {
  const matches = content.match(/\b(if|else if|switch|case|for|while|catch)\b|&&|\|\|/g);
  return matches?.length ?? 0;
};

const estimateComplexity = (content: string, startLine: number, endLine: number): number => {
  const lines = content.split(/\r?\n/).slice(startLine - 1, endLine);
  const matches = lines.join("\n").match(/\b(if|else if|switch|case|for|while|catch)\b|&&|\|\|/g);
  return Math.max(1, (matches?.length ?? 0) + 1);
};

const buildRoom = (
  content: string,
  name: string,
  kind: string,
  startLine: number,
  endLine: number
): ParsedRoom => {
  const normalizedStart = Math.max(1, startLine);
  const normalizedEnd = Math.max(normalizedStart, endLine);

  return {
    name,
    kind,
    startLine: normalizedStart,
    endLine: normalizedEnd,
    size: Math.max(1, normalizedEnd - normalizedStart + 1),
    complexity: estimateComplexity(content, normalizedStart, normalizedEnd)
  };
};

type NamedNode = ClassMethod | ClassPrivateMethod | ObjectMethod | ObjectProperty;

const getNodeName = (node: NamedNode): string => {
  const key = node.key;

  if (!key) {
    return "anonymous";
  }

  if (key.type === "Identifier") {
    return key.name ?? "anonymous";
  }

  if (key.type === "StringLiteral") {
    return key.value ?? "anonymous";
  }

  if (key.type === "PrivateName") {
    return key.id.name ?? "anonymous";
  }

  return "anonymous";
};

const getClassName = (pathLike: NodePath<Node>): string | undefined => {
  const parentClass = pathLike.findParent(
    (candidate) => candidate.isClassDeclaration() || candidate.isClassExpression()
  );

  if (parentClass?.isClassDeclaration() || parentClass?.isClassExpression()) {
    return parentClass.node.id?.name;
  }

  return undefined;
};

const extractRegexFunctions = (content: string, language: string): ParsedRoom[] => {
  const lines = content.split(/\r?\n/);
  const matches: Array<{ line: number; name: string; kind: string }> = [];

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    const trimmed = line.trim();

    const pushMatch = (name: string | undefined, kind: string): void => {
      if (!name || CONTROL_KEYWORDS.has(name)) {
        return;
      }

      matches.push({ line: lineNumber, name, kind });
    };

    if (language === "python") {
      const match = trimmed.match(/^(?:async\s+def|def)\s+([A-Za-z_][\w]*)\s*\(/);
      pushMatch(match?.[1], "function");
      return;
    }

    if (language === "go") {
      const match = trimmed.match(/^func\s+(?:\([^)]+\)\s+)?([A-Za-z_][\w]*)\s*\(/);
      pushMatch(match?.[1], "function");
      return;
    }

    if (language === "rust") {
      const match = trimmed.match(/^(?:pub\s+)?fn\s+([A-Za-z_][\w]*)\s*\(/);
      pushMatch(match?.[1], "function");
      return;
    }

    if (language === "php") {
      const match = trimmed.match(
        /^(?:(?:public|private|protected|static|final|abstract)\s+)*function\s+([A-Za-z_][\w]*)\s*\(/
      );
      pushMatch(match?.[1], "function");
      return;
    }

    if (language === "ruby") {
      const match = trimmed.match(/^def\s+([A-Za-z_][\w!?=]*)/);
      pushMatch(match?.[1], "function");
      return;
    }

    if (language === "java" || language === "csharp" || language === "cpp" || language === "c") {
      const match = trimmed.match(
        /^(?:(?:public|private|protected|internal|static|final|virtual|override|async|sealed|abstract|inline)\s+)*[\w<>,:\s*&?[\]]+\s+([A-Za-z_][\w]*)\s*\([^;]*\)\s*\{?$/
      );
      pushMatch(match?.[1], "method");
      return;
    }

    if (language === "javascript" || language === "typescript") {
      const functionMatch = trimmed.match(
        /^(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/
      );
      const variableMatch = trimmed.match(
        /^(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>/
      );
      pushMatch(functionMatch?.[1] ?? variableMatch?.[1], "function");
    }
  });

  return matches.map((match, index) => {
    const nextLine = matches[index + 1]?.line ?? lines.length;
    return buildRoom(
      content,
      match.name,
      match.kind,
      match.line,
      Math.max(match.line, nextLine - 1)
    );
  });
};

const extractJavaScriptFunctions = (content: string): ParsedRoom[] => {
  try {
    const ast = parse(content, {
      sourceType: "unambiguous",
      errorRecovery: true,
      plugins: [
        "jsx",
        "typescript",
        "decorators-legacy",
        "classProperties",
        "classPrivateMethods",
        "classPrivateProperties",
        "objectRestSpread",
        "topLevelAwait"
      ]
    });

    const rooms: ParsedRoom[] = [];
    const seen = new Set<string>();

    const registerRoom = (
      name: string | undefined,
      kind: string,
      startLine: number | undefined,
      endLine: number | undefined
    ): void => {
      if (!name || !startLine || !endLine) {
        return;
      }

      const room = buildRoom(content, name, kind, startLine, endLine);
      const roomKey = `${room.name}:${room.kind}:${room.startLine}:${room.endLine}`;

      if (seen.has(roomKey)) {
        return;
      }

      seen.add(roomKey);
      rooms.push(room);
    };

    traverse(ast, {
      FunctionDeclaration(astPath) {
        registerRoom(
          astPath.node.id?.name ?? "anonymousFunction",
          "function",
          astPath.node.loc?.start.line,
          astPath.node.loc?.end.line
        );
      },
      VariableDeclarator(astPath) {
        const init = astPath.node.init;

        if (
          init &&
          (init.type === "ArrowFunctionExpression" || init.type === "FunctionExpression")
        ) {
          registerRoom(
            astPath.node.id.type === "Identifier" ? astPath.node.id.name : "anonymousVariable",
            init.type === "ArrowFunctionExpression" ? "arrow-function" : "function-expression",
            init.loc?.start.line,
            init.loc?.end.line
          );
        }
      },
      ClassMethod(astPath) {
        const className = getClassName(astPath);
        const methodName = getNodeName(astPath.node);

        registerRoom(
          className ? `${className}.${methodName}` : methodName,
          "method",
          astPath.node.loc?.start.line,
          astPath.node.loc?.end.line
        );
      },
      ClassPrivateMethod(astPath) {
        const className = getClassName(astPath);
        const methodName = getNodeName(astPath.node);

        registerRoom(
          className ? `${className}.${methodName}` : methodName,
          "private-method",
          astPath.node.loc?.start.line,
          astPath.node.loc?.end.line
        );
      },
      ObjectMethod(astPath) {
        registerRoom(
          getNodeName(astPath.node),
          "object-method",
          astPath.node.loc?.start.line,
          astPath.node.loc?.end.line
        );
      },
      ObjectProperty(astPath) {
        const value = astPath.node.value;

        if (
          value &&
          (value.type === "ArrowFunctionExpression" || value.type === "FunctionExpression")
        ) {
          registerRoom(
            getNodeName(astPath.node),
            value.type === "ArrowFunctionExpression" ? "object-arrow" : "object-function",
            value.loc?.start.line,
            value.loc?.end.line
          );
        }
      }
    });

    return rooms.sort((left, right) => left.startLine - right.startLine);
  } catch {
    return extractRegexFunctions(content, "javascript");
  }
};

const extractFunctions = (content: string, language: string): ParsedRoom[] => {
  if (language === "javascript" || language === "typescript") {
    return extractJavaScriptFunctions(content);
  }

  if (
    language === "python" ||
    language === "go" ||
    language === "rust" ||
    language === "php" ||
    language === "ruby" ||
    language === "java" ||
    language === "csharp" ||
    language === "cpp" ||
    language === "c"
  ) {
    return extractRegexFunctions(content, language);
  }

  return [];
};

const parseRepositoryFile = async (
  filePath: string,
  repositoryRoot: string
): Promise<ParsedFile | null> => {
  const stats = await fs.stat(filePath);

  if (stats.size > MAX_FILE_SIZE_BYTES) {
    return null;
  }

  const buffer = await fs.readFile(filePath);

  if (buffer.includes(0)) {
    return null;
  }

  const content = buffer.toString("utf8");
  const relativePath = normalizePath(path.relative(repositoryRoot, filePath));
  const extension = path.extname(filePath).toLowerCase();
  const language = LANGUAGE_BY_EXTENSION[extension] ?? "text";
  const functions = extractFunctions(content, language);
  const loc = countLogicalLines(content);
  const commentLines = countCommentLines(content, language);
  const branchingSignals = estimateBranchingSignals(content);

  return {
    path: relativePath,
    name: path.basename(filePath),
    extension: extension || path.basename(filePath),
    language,
    loc,
    metrics: {
      functionCount: functions.length,
      commentLines,
      branchingSignals,
      densityScore: Number((loc / Math.max(1, functions.length || 1)).toFixed(2))
    },
    functions
  };
};

export const parseRepository = async (
  extractedRoot: string,
  sourceFilename: string,
  label?: string
): Promise<ParsedProject> => {
  const repositoryRoot = await resolveRepositoryRoot(extractedRoot);
  const candidateFiles = await collectCandidateFiles(repositoryRoot);
  const files = (
    await Promise.all(
      candidateFiles.map((filePath) => parseRepositoryFile(filePath, repositoryRoot))
    )
  ).filter((file): file is ParsedFile => Boolean(file));

  const sortedFiles = files.sort((left, right) => {
    if (right.loc !== left.loc) {
      return right.loc - left.loc;
    }

    return left.path.localeCompare(right.path);
  });

  return {
    name: label?.trim() || path.basename(repositoryRoot),
    sourceFilename,
    files: sortedFiles,
    stats: {
      totalFiles: sortedFiles.length,
      totalFunctions: sortedFiles.reduce((sum, file) => sum + file.functions.length, 0),
      totalLoc: sortedFiles.reduce((sum, file) => sum + file.loc, 0)
    }
  };
};
