import * as ts from "typescript";
import path from "node:path";
export type ModuleId = number & { readonly __brand: "ModuleId" };
export type ItemId = number & { readonly __brand: "ItemId" };
export type ItemKind =
  "module" | "type" | "function" | "field" | "constant" | "other";
export type ModuleInfo = {
  readonly id: ModuleId;
  readonly path: string;
  readonly lines: number;
};
export type Item = {
  readonly id: ItemId;
  readonly kind: ItemKind;
  readonly name: string;
  readonly owner: ModuleId;
  readonly parent: ItemId | null;
  readonly file: string;
  readonly line: number;
  readonly exported: boolean;
};
export type Reference = {
  readonly file: string;
  readonly line: number;
  readonly from: ModuleId;
  readonly holder: ItemId | null;
  readonly item: ItemId;
  readonly copies: boolean;
};
export type ImportEdge = {
  readonly from: ModuleId;
  readonly to: ModuleId;
  readonly typeOnly: boolean;
  readonly dynamic: boolean;
};
export type Model = {
  readonly root: string;
  readonly modules: readonly ModuleInfo[];
  readonly items: readonly Item[];
  readonly references: readonly Reference[];
  readonly imports: readonly ImportEdge[];
};
export function buildModel(root: string): Model {
  const configPath = ts.findConfigFile(
    root,
    (fileName) => ts.sys.fileExists(fileName),
    "tsconfig.json",
  );
  if (!configPath) throw new Error(`no tsconfig.json found under ${root}`);
  const { config, error } = ts.readConfigFile(configPath, (fileName) =>
    ts.sys.readFile(fileName),
  );
  if (error) {
    throw new Error(ts.flattenDiagnosticMessageText(error.messageText, "\n"));
  }
  const parsed = ts.parseJsonConfigFileContent(
    config,
    ts.sys,
    path.dirname(configPath),
  );
  const program = ts.createProgram({
    rootNames: parsed.fileNames,
    options: parsed.options,
  });
  const checker = program.getTypeChecker();
  const sourceFiles = program
    .getSourceFiles()
    .filter(
      (sf) => !sf.isDeclarationFile && !sf.fileName.includes("node_modules"),
    );
  const modules: ModuleInfo[] = [];
  const pathToModule = new Map<string, ModuleId>();
  for (const sf of sourceFiles) {
    const id = toModuleId(modules.length);
    modules.push({
      id,
      path: sf.fileName,
      lines: sf.getLineStarts().length,
    });
    pathToModule.set(sf.fileName, id);
  }
  const items: Item[] = [];
  const nodeToItem = new Map<ts.Node, ItemId>();
  const symbolToItem = new Map<ts.Symbol, ItemId>();
  for (const sf of sourceFiles) {
    const moduleId = pathToModule.get(sf.fileName);
    if (moduleId === undefined) continue;
    collectItems(sf, moduleId, checker, items, nodeToItem, symbolToItem);
  }
  const references: Reference[] = [];
  for (const sf of sourceFiles) {
    const moduleId = pathToModule.get(sf.fileName);
    if (moduleId === undefined) continue;
    collectReferences(
      sf,
      moduleId,
      checker,
      symbolToItem,
      nodeToItem,
      references,
    );
  }
  const imports: ImportEdge[] = [];
  for (const sf of sourceFiles) {
    const moduleId = pathToModule.get(sf.fileName);
    if (moduleId === undefined) continue;
    collectImports(sf, moduleId, checker, pathToModule, imports);
  }
  return { root, modules, items, references, imports } satisfies Model;
}
export function formatModel(model: Model): string {
  const lines: string[] = [];
  lines.push(`Model root: ${model.root}`, `Modules (${model.modules.length}):`);
  for (const m of model.modules) lines.push(`  [${m.id}] ${m.path}`);
  lines.push(`Items (${model.items.length}):`);
  for (const it of model.items) {
    lines.push(
      `  [${it.id}] ${it.kind} ${it.name} (module ${it.owner}, parent ${it.parent ?? "none"}, ${it.file}:${it.line})`,
    );
  }
  lines.push(`References (${model.references.length}):`);
  for (const r of model.references) {
    lines.push(
      `  ${r.file}:${r.line} module ${r.from} holder ${r.holder ?? "none"} -> item ${r.item} copies=${r.copies}`,
    );
  }
  lines.push(`Imports (${model.imports.length}):`);
  for (const e of model.imports) {
    lines.push(
      `  module ${e.from} -> module ${e.to} typeOnly=${e.typeOnly} dynamic=${e.dynamic}`,
    );
  }
  return lines.join("\n");
}
function collectItems(
  sourceFile: ts.SourceFile,
  moduleId: ModuleId,
  checker: ts.TypeChecker,
  items: Item[],
  nodeToItem: Map<ts.Node, ItemId>,
  symbolToItem: Map<ts.Symbol, ItemId>,
): void {
  function visit(node: ts.Node, parentItemId: ItemId | null): void {
    if (ts.isVariableStatement(node)) {
      const exported = isExported(node);
      for (const decl of node.declarationList.declarations) {
        const n = ts.isIdentifier(decl.name) ? decl.name.text : null;
        if (n) {
          addItem({
            items,
            nodeToItem,
            symbolToItem,
            checker,
            kind: "constant",
            name: n,
            node: decl,
            sourceFile,
            moduleId,
            parent: parentItemId,
            exported,
          });
        }
      }
      ts.forEachChild(node, (c) => visit(c, parentItemId));
      return;
    }
    const kind = classifyDeclaration(node);
    const name = kind ? nameOf(node) : null;
    if (kind && name) {
      const id = addItem({
        items,
        nodeToItem,
        symbolToItem,
        checker,
        kind,
        name,
        node,
        sourceFile,
        moduleId,
        parent: parentItemId,
        exported: isExported(node),
      });
      const childParent = kind === "type" ? id : parentItemId;
      ts.forEachChild(node, (c) => visit(c, childParent));
      return;
    }
    ts.forEachChild(node, (c) => visit(c, parentItemId));
  }
  visit(sourceFile, null);
}
function collectReferences(
  sourceFile: ts.SourceFile,
  moduleId: ModuleId,
  checker: ts.TypeChecker,
  symbolToItem: Map<ts.Symbol, ItemId>,
  nodeToItem: Map<ts.Node, ItemId>,
  refs: Reference[],
): void {
  function visit(node: ts.Node, holder: ItemId | null): void {
    const itemForNode = nodeToItem.get(node);
    const newHolder = itemForNode ?? holder;
    if (ts.isIdentifier(node)) {
      const parentNode: ts.Node | undefined = node.parent;

      const isDeclarationNode = isDeclarationParent(parentNode);
      const isDeclarationName =
        isDeclarationNode && declaredName(parentNode) === node;
      if (!isDeclarationName) {
        const sym = checker.getSymbolAtLocation(node);
        if (sym) {
          const resolved =
            sym.flags & ts.SymbolFlags.Alias
              ? checker.getAliasedSymbol(sym)
              : sym;
          const itemId = symbolToItem.get(resolved);
          if (itemId !== undefined) {
            refs.push({
              file: sourceFile.fileName,
              line: lineOf(sourceFile, node),
              from: moduleId,
              holder,
              item: itemId,
              copies: computeCopies(node),
            });
          }
        }
      }
    }
    ts.forEachChild(node, (c) => visit(c, newHolder));
  }
  visit(sourceFile, null);
}
function collectImports(
  sourceFile: ts.SourceFile,
  moduleId: ModuleId,
  checker: ts.TypeChecker,
  pathToModule: Map<string, ModuleId>,
  edges: ImportEdge[],
): void {
  function visit(node: ts.Node): void {
    if (ts.isImportDeclaration(node)) {
      const clause = node.importClause;
      const typeOnly = clause?.phaseModifier === ts.SyntaxKind.TypeKeyword;
      addEdge(node.moduleSpecifier, typeOnly, false);
    } else if (ts.isExportDeclaration(node)) {
      if (node.moduleSpecifier)
        addEdge(node.moduleSpecifier, node.isTypeOnly, false);
    } else if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments.length > 0
    ) {
      const arg = node.arguments[0];
      if (arg && ts.isStringLiteralLike(arg)) addEdge(arg, false, true);
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  function addEdge(
    specifier: ts.Expression,
    typeOnly: boolean,
    dynamic: boolean,
  ): void {
    const sym = checker.getSymbolAtLocation(specifier);
    if (!sym) return;
    const decl = sym.declarations?.[0];
    if (!decl || !ts.isSourceFile(decl)) return;
    const to = pathToModule.get(decl.fileName);
    if (to === undefined) return;
    edges.push({ from: moduleId, to, typeOnly, dynamic });
  }
}
function addItem(params: {
  items: Item[];
  nodeToItem: Map<ts.Node, ItemId>;
  symbolToItem: Map<ts.Symbol, ItemId>;
  checker: ts.TypeChecker;
  kind: ItemKind;
  name: string;
  node: ts.Node;
  sourceFile: ts.SourceFile;
  moduleId: ModuleId;
  parent: ItemId | null;
  exported: boolean;
}): ItemId {
  const {
    items,
    nodeToItem,
    symbolToItem,
    checker,
    kind,
    name,
    node,
    sourceFile,
    moduleId,
    parent,
    exported,
  } = params;
  const id = toItemId(items.length);
  items.push({
    id,
    kind,
    name,
    owner: moduleId,
    parent,
    file: sourceFile.fileName,
    line: lineOf(sourceFile, node),
    exported,
  });
  nodeToItem.set(node, id);
  const nameNode = declaredName(node);
  if (nameNode) {
    const sym = checker.getSymbolAtLocation(nameNode);
    if (sym) symbolToItem.set(sym, id);
  }
  return id;
}
function classifyDeclaration(node: ts.Node): ItemKind | null {
  if (
    ts.isClassDeclaration(node) ||
    ts.isInterfaceDeclaration(node) ||
    ts.isTypeAliasDeclaration(node) ||
    ts.isEnumDeclaration(node)
  ) {
    return "type";
  }
  if (ts.isFunctionDeclaration(node)) return "function";
  if (
    ts.isMethodDeclaration(node) ||
    ts.isMethodSignature(node) ||
    ts.isGetAccessorDeclaration(node) ||
    ts.isSetAccessorDeclaration(node)
  ) {
    return "function";
  }
  // Only class property declarations are implementation fields that can leak.
  // Interface/type-alias property signatures are part of the public contract
  // of a type, not leaked implementation fields (see issue #7).
  if (ts.isPropertyDeclaration(node)) {
    return "field";
  }
  return null;
}
function isExported(node: ts.Node): boolean {
  if (!ts.canHaveModifiers(node)) return false;
  const modifiers = ts.getModifiers(node);
  return (
    modifiers?.some(
      (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
    ) ?? false
  );
}
function nameOf(node: ts.Node): string | null {
  const n = declaredName(node);
  if (!n) return null;
  if (ts.isIdentifier(n)) return n.text;
  if (ts.isLiteralExpression(n)) {
    return String(n.text);
  }
  return null;
}
function computeCopies(node: ts.Identifier): boolean {
  const parent = node.parent;
  if (!parent) return true;
  let accessNode: ts.Node = node;
  if (
    (ts.isPropertyAccessExpression(parent) && parent.name === node) ||
    (ts.isElementAccessExpression(parent) && parent.argumentExpression === node)
  ) {
    accessNode = parent;
  }
  const container = accessNode.parent;
  if (
    ts.isBinaryExpression(container) &&
    container.left === accessNode &&
    isAssignmentOp(container.operatorToken.kind)
  ) {
    return false;
  }
  return !(
    (ts.isPropertyAccessExpression(container) ||
      ts.isElementAccessExpression(container)) &&
    container.expression === accessNode
  );
}
function lineOf(sourceFile: ts.SourceFile, node: ts.Node): number {
  return ts.getLineAndCharacterOfPosition(sourceFile, node.getStart()).line + 1;
}
const ASSIGNMENT_OPS = new Set<number>([
  ts.SyntaxKind.EqualsToken,
  ts.SyntaxKind.PlusEqualsToken,
  ts.SyntaxKind.MinusEqualsToken,
  ts.SyntaxKind.AsteriskEqualsToken,
  ts.SyntaxKind.SlashEqualsToken,
  ts.SyntaxKind.PercentEqualsToken,
]);

function isAssignmentOp(kind: number): boolean {
  return ASSIGNMENT_OPS.has(kind);
}
export function toModuleId(value: number): ModuleId {
  return value as ModuleId;
}
export function toItemId(value: number): ItemId {
  return value as ItemId;
}
function declaredName(node: ts.Node): ts.Node | undefined {
  const value: unknown = Reflect.get(node, "name");
  if (!isTsNode(value)) return undefined;
  return value;
}

function isTsNode(value: unknown): value is ts.Node {
  if (typeof value !== "object" || value === null) return false;
  if (!("kind" in value)) return false;
  return typeof Reflect.get(value, "kind") === "number";
}
function isDeclarationParent(node: ts.Node | undefined): boolean {
  if (node === undefined) return false;
  return (
    ts.isClassDeclaration(node) ||
    ts.isInterfaceDeclaration(node) ||
    ts.isTypeAliasDeclaration(node) ||
    ts.isEnumDeclaration(node) ||
    ts.isFunctionDeclaration(node) ||
    ts.isMethodDeclaration(node) ||
    ts.isMethodSignature(node) ||
    ts.isPropertyDeclaration(node) ||
    ts.isPropertySignature(node) ||
    ts.isGetAccessorDeclaration(node) ||
    ts.isSetAccessorDeclaration(node) ||
    ts.isVariableDeclaration(node)
  );
}
