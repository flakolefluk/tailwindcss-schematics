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

import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';
import { NgAddOptions } from './schema';
import { normalize } from '@angular-devkit/core';
import {
  getWorkspace,
  getProject,
  getProjectRoot,
  getProjectStylesFormat,
  getPackageJson,
} from '../common/utils';

export function ngAdd(options: NgAddOptions): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    const workspace = getWorkspace(tree);
    const projectName = options.project || workspace.defaultProject;
    const project = getProject(workspace, projectName);
    const root = getProjectRoot(project);
    const stylesFormat = getProjectStylesFormat(project);
    const packageJson = getPackageJson(tree);

    const coreVersion: string = packageJson.dependencies['@angular/core'];

    if (!coreVersion) {
      throw new SchematicsException(
        'Could not find @angular/core version in package.json.',
      );
    }

    const majorVersion: number = parseInt(
      coreVersion.split('.')[0].replace(/\D/g, ''), 10
    );

    if (majorVersion < 8) {
      throw new SchematicsException('Minimum version requirement not met.');
    }

    return chain([
      createWebpackConfigFiles(stylesFormat, root),
      createTailwindConfigFile(root),
      updateStylesFile(root, stylesFormat),
      updateAngularConfig(workspace, projectName, root),
      updatePackageJson(packageJson),
      installDependencies(),
    ])(tree, _context);
  };
}

function createWebpackConfigFiles(
  stylesFormat: string,
  projectRoot: string,
): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    const source: Source = url('files/webpack');
    return mergeWith(
      apply(source, [template({ stylesFormat }), move(normalize(`${projectRoot}/..`))]),
    )(tree, _context);
  };
}

function createTailwindConfigFile(projectRoot: string): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    const source: Source = url('files/tailwind');
    return mergeWith(apply(source, [move(normalize(`${projectRoot}/..`))]))(
      tree,
      _context,
    );
  };
}

function updatePackageJson(pkgJson: any): Rule {
  return (tree: Tree, _context: SchematicContext): Tree => {
    pkgJson.devDependencies = pkgJson.devDependencies || {};

    const builderVersion =
      pkgJson.devDependencies['@angular-devkit/build-angular'];

    pkgJson.devDependencies['@angular-builders/custom-webpack'] =
      pkgJson.devDependencies['@angular-builders/custom-webpack'] ||
      (builderVersion
        ? `~${builderVersion
            .substring(
              builderVersion.indexOf('.') + 1,
              builderVersion.lastIndexOf('.'),
            )
            .split('')
            .join('.')}`
        : '~8.0.0');

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

function updateStylesFile(root: string, format: string): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    const file = tree.read(`${root}/styles.${format}`);

    if (!file) {
      throw new SchematicsException('Style file not found.');
    }

    const fileContent = file.toString();

    const imports = [
      '@tailwind base;',
      '@tailwind components;',
      '@tailwind utilities;',
    ];

    const recorder = tree.beginUpdate(`${root}/styles.${format}`);
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
  root: string,
): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    workspace.projects[projectName].architect.build.builder =
      '@angular-builders/custom-webpack:browser';

    workspace.projects[
      projectName
    ].architect.build.options.customWebpackConfig = {
      path: path.join(root, '..', 'webpack.config.js'),
    };

    workspace.projects[
      projectName
    ].architect.build.configurations.production.customWebpackConfig = {
      path: path.join(root, '..', 'webpack-prod.config.js'),
    };

    workspace.projects[projectName].architect.serve.builder =
      '@angular-builders/custom-webpack:dev-server';
    tree.overwrite('angular.json', JSON.stringify(workspace, null, 2));
  };
}

function installDependencies(): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    _context.addTask(new NodePackageInstallTask());
    return tree;
  };
}
