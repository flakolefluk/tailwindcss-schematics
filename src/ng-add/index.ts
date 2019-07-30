import {
  Rule,
  SchematicContext,
  Tree,
  chain,
  url,
  mergeWith,
  Source,
  template,
  apply,
  SchematicsException,
  move
} from "@angular-devkit/schematics";

import * as path from "path";

import { NodePackageInstallTask } from "@angular-devkit/schematics/tasks";
import { NgAddOptions } from "./schema";
import { normalize } from "@angular-devkit/core";

export function ngAdd(options: NgAddOptions): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    const workspaceConfig = tree.read("/angular.json");
    if (!workspaceConfig) {
      throw new SchematicsException(
        "Could not find Angular workspace configuration"
      );
    }

    const workspaceContent = workspaceConfig.toString();

    const workspace = JSON.parse(workspaceContent);
    if (!options.project) {
      options.project = workspace.defaultProject as string;
    }

    const projectName = options.project as string;

    const project = workspace.projects[projectName];

    const rootSrc = project.sourceRoot as string;
    const root = path.join(rootSrc, "..");

    if (!tree.exists("package.json")) {
      throw new SchematicsException("package.json not found.");
    }
    const packageJson = JSON.parse(tree.read("package.json")!.toString());
    const coreVersion: string = packageJson.dependencies["@angular/core"];

    if (!coreVersion) {
      throw new SchematicsException(
        "Could not find @angular/core version in package.json."
      );
    }

    const majorVersion: number = parseInt(
      coreVersion.split(".")[0].replace(/\D/g, "")
    );

    if (majorVersion < 8) {
      throw new SchematicsException("Minimum version requirement not met.");
    }

    const styles: string[] = project.architect.build.options.styles;
    const stylePath =
      styles.find(style => style.includes(path.join(rootSrc, "styles"))) ||
      styles.find(style => style.includes(path.join(rootSrc, "")));

    if (!stylePath) {
      throw new SchematicsException("Style file not found.");
    }

    const stylesExtension = path.extname(stylePath);



    return chain([
      createWebpackConfigFiles(stylesExtension, root),
      createTailwindConfigFile(root),
      updateStylesFile(stylePath),
      updateAngularConfig(workspace, projectName, root),
      updatePackageJson(packageJson),
      installDependencies()
    ])(tree, _context);
  };
}

function createWebpackConfigFiles(
  stylesFormat: string,
  projectRoot: string
): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    const source: Source = url("files/webpack");
    return mergeWith(
      apply(source, [template({ stylesFormat }), move(normalize(projectRoot))])
    )(tree, _context);
  };
}

function createTailwindConfigFile(projectRoot: string): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    const source: Source = url("files/tailwind");
    return mergeWith(apply(source, [move(normalize(projectRoot))]))(
      tree,
      _context
    );
  };
}

function updatePackageJson(pkgJson: any): Rule {
  return (tree: Tree, _context: SchematicContext): Tree => {
    pkgJson.devDependencies = pkgJson.devDependencies || {};

    const builderVersion =
      pkgJson.devDependencies["@angular-devkit/build-angular"];

    pkgJson.devDependencies["@angular-builders/custom-webpack"] =
      pkgJson.devDependencies["@angular-builders/custom-webpack"] ||
      (builderVersion
        ? `~${builderVersion
            .substring(
              builderVersion.indexOf(".") + 1,
              builderVersion.lastIndexOf(".")
            )
            .split("")
            .join(".")}`
        : "~8.0.0");

    pkgJson.devDependencies["@angular-devkit/build-angular"] =
      builderVersion || "~0.800.0";

    pkgJson.devDependencies["@fullhuman/postcss-purgecss"] =
      pkgJson.devDependencies["@fullhuman/postcss-purgecss"] || "~1.2.0";

    pkgJson.devDependencies["tailwindcss"] =
      pkgJson.devDependencies["tailwindcss"] || "~1.0.5";

    tree.overwrite("package.json", JSON.stringify(pkgJson, null, 2));

    return tree;
  };
}


function updateStylesFile(path: string): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    const fileContent = tree.read(path)!.toString();

    const imports = [
      "@tailwind base;",
      "@tailwind components;",
      "@tailwind utilities;"
    ];

    const recorder = tree.beginUpdate(path);
    imports.forEach(imported => {
      if (!fileContent.includes(imported)) {
        recorder.insertLeft(0, `${imported}\n`);
      }
    });
    tree.commitUpdate(recorder);
    return tree;
  };
}

function updateAngularConfig(
  workspace: any,
  projectName: string,
  root: string
): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    workspace.projects[projectName].architect.build.builder =
      "@angular-builders/custom-webpack:browser";

    workspace.projects[
      projectName
    ].architect.build.options.customWebpackConfig = {
      path: path.join(".", root, "webpack.config.js")
    };

    workspace.projects[
      projectName
    ].architect.build.configurations.production.customWebpackConfig = {
      path: path.join(".", root, "webpack-prod.config.js")
    };

    workspace.projects[projectName].architect.serve.builder =
      "@angular-builders/custom-webpack:dev-server";
    tree.overwrite("angular.json", JSON.stringify(workspace, null, 2));
  };
}

function installDependencies(): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    _context.addTask(new NodePackageInstallTask());
    return tree;
  };
}
