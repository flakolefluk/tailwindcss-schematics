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
  move,
} from '@angular-devkit/schematics';

import * as path from 'path';

import { NgAddSetupOptions } from './schema';
import { normalize } from '@angular-devkit/core';
import { PackageJson, Workspace } from '../common/models';
import {
  getWorkspace,
  getProject,
  getProjectSrcRoot,
  getProjectStylesExt,
  getPackageJson,
} from '../common/utils';

export function ngAddSetup(options: NgAddSetupOptions): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    const workspace = getWorkspace(tree);
    const project = getProject(workspace, options.project);
    const root = getProjectSrcRoot(project);
    const stylesExt = getProjectStylesExt(project);
    const packageJson = getPackageJson(tree);

    return chain([
      addWebpackConfigFiles(stylesExt, root),
      addTailwindConfigFile(root),
      updateStylesFile(root, stylesExt),
      updateAngularConfig(workspace, options.project, root),
      updatePackageJson(packageJson),
    ])(tree, _context);
  };
}

function addWebpackConfigFiles(
  stylesExt: string,
  projectSrcRoot: string,
): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    const source: Source = url('files/webpack');
    return mergeWith(
      apply(source, [
        template({ stylesExt }),
        move(normalize(`${projectSrcRoot}/..`)),
      ]),
    )(tree, _context);
  };
}

function addTailwindConfigFile(projectSrcRoot: string): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    const source: Source = url('files/tailwind');
    return mergeWith(apply(source, [move(normalize(`${projectSrcRoot}/..`))]))(
      tree,
      _context,
    );
  };
}

function updatePackageJson(pkgJson: PackageJson): Rule {
  return (tree: Tree, _context: SchematicContext): Tree => {
    let customBuilderVersion: string = '';

    pkgJson.devDependencies = pkgJson.devDependencies || {};

    const builderVersion =
      pkgJson.devDependencies['@angular-devkit/build-angular'];

    if (builderVersion) {
      const partialVersion = builderVersion.substring(
        builderVersion.indexOf('.') + 1,
        builderVersion.lastIndexOf('.'),
      );
      customBuilderVersion = `~${partialVersion[0]}.${partialVersion[2]}.0`;
    }

    pkgJson.devDependencies['@angular-builders/custom-webpack'] =
      pkgJson.devDependencies['@angular-builders/custom-webpack'] ||
      customBuilderVersion ||
      '~8.0.0';

    pkgJson.devDependencies['@angular-devkit/build-angular'] =
      builderVersion || '~0.800.0';

    pkgJson.devDependencies['@fullhuman/postcss-purgecss'] =
      pkgJson.devDependencies['@fullhuman/postcss-purgecss'] || '~1.2.0';

    pkgJson.devDependencies['tailwindcss'] =
      pkgJson.devDependencies['tailwindcss'] || '~1.1.2';

    tree.overwrite('package.json', JSON.stringify(pkgJson, null, 2));

    return tree;
  };
}

function updateStylesFile(projectSrcRoot: string, stylesExt: string): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    const file = tree.read(`${projectSrcRoot}/styles.${stylesExt}`);

    if (!file) {
      throw new SchematicsException('Style file not found.');
    }

    const fileContent = file.toString();

    const imports = [
      '@tailwind base;',
      '@tailwind components;',
      '@tailwind utilities;',
    ];

    const recorder = tree.beginUpdate(`${projectSrcRoot}/styles.${stylesExt}`);
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
  workspace: Workspace,
  projectName: string,
  projectSrcRoot: string,
): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    workspace.projects[projectName].architect.build.builder =
      '@angular-builders/custom-webpack:browser';

    workspace.projects[
      projectName
    ].architect.build.options.customWebpackConfig = {
      path: path.join(projectSrcRoot, '..', 'webpack.config.js'),
    };

    workspace.projects[
      projectName
    ].architect.build.configurations.production.customWebpackConfig = {
      path: path.join(projectSrcRoot, '..', 'webpack-prod.config.js'),
    };

    workspace.projects[projectName].architect.serve.builder =
      '@angular-builders/custom-webpack:dev-server';
    tree.overwrite('angular.json', JSON.stringify(workspace, null, 2));
  };
}
