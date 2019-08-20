import {
  SchematicTestRunner,
  UnitTestTree,
} from '@angular-devkit/schematics/testing';
import * as path from 'path';

const collectionPath = path.join(__dirname, '../collection.json');

describe('ng-add', () => {
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

    it('works', () => {
      const tree = runner.runSchematic(
        'ng-add',
        { project: 'testApp' },
        sourceTree,
      );

      expect(tree.files).toContain('/projects/testApp/tailwind.config.js');
      expect(tree.files).toContain('/projects/testApp/webpack-prod.config.js');
      expect(tree.files).toContain('/projects/testApp/webpack.config.js');
      expect(tree.files).toContain('/projects/testApp/src/styles.css');

      expect(tree.readContent('/projects/testApp/src/styles.css')).toContain(
        '@tailwind base;',
      );
      expect(tree.readContent('/projects/testApp/src/styles.css')).toContain(
        '@tailwind components;',
      );
      expect(tree.readContent('/projects/testApp/src/styles.css')).toContain(
        '@tailwind utilities;',
      );

      expect(
        JSON.parse(tree.readContent('angular.json')).projects.testApp.architect
          .build.builder,
      ).toBe('@angular-builders/custom-webpack:browser');

      expect(
        JSON.parse(tree.readContent('angular.json')).projects.testApp.architect
          .build.options.customWebpackConfig.path,
      ).toBe('/projects/testApp/webpack.config.js');

      expect(
        JSON.parse(tree.readContent('angular.json')).projects.testApp.architect.build
          .configurations.production.customWebpackConfig.path,
      ).toBe('/projects/testApp/webpack-prod.config.js');

      expect(
        JSON.parse(tree.readContent('angular.json')).projects.testApp.architect
          .serve.builder,
      ).toBe('@angular-builders/custom-webpack:dev-server');

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

    it('works', () => {
      const tree = runner.runSchematic(
        'ng-add',
        { project: 'testApp' },
        sourceTree,
      );

      expect(tree.files).toContain('/projects/testApp/tailwind.config.js');
      expect(tree.files).toContain('/projects/testApp/webpack-prod.config.js');
      expect(tree.files).toContain('/projects/testApp/webpack.config.js');
      expect(tree.files).toContain('/projects/testApp/src/styles.scss');

      expect(tree.readContent('/projects/testApp/src/styles.scss')).toContain(
        '@tailwind base;',
      );
      expect(tree.readContent('/projects/testApp/src/styles.scss')).toContain(
        '@tailwind components;',
      );
      expect(tree.readContent('/projects/testApp/src/styles.scss')).toContain(
        '@tailwind utilities;',
      );

      expect(
        JSON.parse(tree.readContent('angular.json')).projects.testApp.architect
          .build.builder,
      ).toBe('@angular-builders/custom-webpack:browser');

      expect(
        JSON.parse(tree.readContent('angular.json')).projects.testApp.architect
          .build.options.customWebpackConfig.path,
      ).toBe('/projects/testApp/webpack.config.js');

      expect(
        JSON.parse(tree.readContent('angular.json')).projects.testApp.architect.build
          .configurations.production.customWebpackConfig.path,
      ).toBe('/projects/testApp/webpack-prod.config.js');

      expect(
        JSON.parse(tree.readContent('angular.json')).projects.testApp.architect
          .serve.builder,
      ).toBe('@angular-builders/custom-webpack:dev-server');
    });
  });
});
