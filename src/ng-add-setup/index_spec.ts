import {
  SchematicTestRunner,
  UnitTestTree,
} from '@angular-devkit/schematics/testing';
import * as path from 'path';

const collectionPath = path.join(__dirname, '../collection.json');

describe('ng-add-setup', () => {
  const workspaceOptions = {
    name: 'workspace',
    newProjectRoot: 'projects',
    version: '8.0.0',
  };

  const appOptions = {
    name: 'testApp',
    inlineStyle: false,
    inlineTemplate: false,
    routing: false,
    style: 'css',
    skipTests: false,
    skipPackageJson: false,
  };

  const runner = new SchematicTestRunner('schematics', collectionPath);

  let sourceTree: UnitTestTree;

  describe('CSS', () => {
    beforeEach(async () => {
      sourceTree = await runner
        .runExternalSchematicAsync(
          '@schematics/angular',
          'workspace',
          workspaceOptions,
        )
        .toPromise();
      sourceTree = await runner
        .runExternalSchematicAsync(
          '@schematics/angular',
          'application',
          appOptions,
          sourceTree,
        )
        .toPromise();
    });

    it('adds and updates files', () => {
      const tree = runner.runSchematic(
        'ng-add-setup',
        { project: 'testApp' },
        sourceTree,
      );

      expect(tree.files).toContain('/projects/testApp/tailwind.config.js');
      expect(tree.files).toContain('/projects/testApp/webpack-prod.config.js');
      expect(tree.files).toContain('/projects/testApp/webpack.config.js');
      expect(tree.files).toContain('/projects/testApp/src/styles.css');

      const stylesFile = tree.readContent('/projects/testApp/src/styles.css');

      expect(stylesFile).toContain('@import "~tailwindcss/dist/base.css";');
      expect(stylesFile).toContain('@import "~tailwindcss/dist/components.css";');
      expect(stylesFile).toContain('@import "~tailwind/dist/utilities.css";');

      const workspace = JSON.parse(tree.readContent('angular.json'));
      const app = workspace.projects.testApp;

      expect(app.architect.build.builder).toBe(
        '@angular-builders/custom-webpack:browser',
      );

      expect(app.architect.build.options.customWebpackConfig.path).toBe(
        '/projects/testApp/webpack.config.js',
      );

      expect(
        app.architect.build.configurations.production.customWebpackConfig.path,
      ).toBe('/projects/testApp/webpack-prod.config.js');

      expect(app.architect.serve.builder).toBe(
        '@angular-builders/custom-webpack:dev-server',
      );
    });
  });

  describe('SCSS', () => {
    beforeEach(async () => {
      sourceTree = await runner
        .runExternalSchematicAsync(
          '@schematics/angular',
          'workspace',
          workspaceOptions,
        )
        .toPromise();
      sourceTree = await runner
        .runExternalSchematicAsync(
          '@schematics/angular',
          'application',
          { ...appOptions, style: 'scss' },
          sourceTree,
        )
        .toPromise();
    });

    it('adds and updates files', () => {
      const tree = runner.runSchematic(
        'ng-add-setup',
        { project: 'testApp' },
        sourceTree,
      );

      expect(tree.files).toContain('/projects/testApp/tailwind.config.js');
      expect(tree.files).toContain('/projects/testApp/webpack-prod.config.js');
      expect(tree.files).toContain('/projects/testApp/webpack.config.js');
      expect(tree.files).toContain('/projects/testApp/src/styles.scss');

      const stylesFile = tree.readContent('/projects/testApp/src/styles.scss');

      expect(stylesFile).toContain('@import "~tailwindcss/dist/base.css";');
      expect(stylesFile).toContain('@import "~tailwindcss/dist/components.css";');
      expect(stylesFile).toContain('@import "~tailwind/dist/utilities.css";')

      const workspace = JSON.parse(tree.readContent('angular.json'));
      const app = workspace.projects.testApp;

      expect(app.architect.build.builder).toBe(
        '@angular-builders/custom-webpack:browser',
      );

      expect(app.architect.build.options.customWebpackConfig.path).toBe(
        '/projects/testApp/webpack.config.js',
      );

      expect(
        app.architect.build.configurations.production.customWebpackConfig.path,
      ).toBe('/projects/testApp/webpack-prod.config.js');

      expect(app.architect.serve.builder).toBe(
        '@angular-builders/custom-webpack:dev-server',
      );
    });
  });
});
