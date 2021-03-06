define([
  'angular',
  'app',
  'underscore'
],
function (angular, app, _) {
  'use strict';

  var module = angular.module('kibana.controllers');

  module.controller('GraphiteImportCtrl', function($scope, $rootScope, $timeout, graphiteSrv, dashboard) {

    $scope.init = function() {
      console.log('hej!');
    };

    $scope.listAll = function(query) {
      delete $scope.error;

      graphiteSrv.listDashboards(query)
        .then(function(results) {
          $scope.dashboards = results;
        })
        .then(null, function(err) {
          $scope.error = err.message || 'Error while fetching list of dashboards';
        });
    };

    $scope.import = function(dashName) {
      delete $scope.error;

      graphiteSrv.loadDashboard(dashName)
        .then(function(results) {
          if (!results.data || !results.data.state) {
            throw { message: 'no dashboard state received from graphite' };
          }

          graphiteToGrafanaTranslator(results.data.state);
        })
        .then(null, function(err) {
          $scope.error = err.message || 'Failed to import dashboard';
        });
    };

    function graphiteToGrafanaTranslator(state) {
      var graphsPerRow = 2;
      var rowHeight = 300;
      var rowTemplate;
      var currentRow;
      var panel;

      rowTemplate = {
        title: '',
        panels: [],
        height: rowHeight
      };

      currentRow = angular.copy(rowTemplate);

      var newDashboard = angular.copy(dashboard.current);
      newDashboard.rows = [];
      newDashboard.title = state.name;
      newDashboard.rows.push(currentRow);

      _.each(state.graphs, function(graph) {
        if (currentRow.panels.length === graphsPerRow) {
          currentRow = angular.copy(rowTemplate);
        }

        panel = {
          type: 'graphite',
          span: 12 / graphsPerRow,
          targets: []
        };

        _.each(graph[1].target, function(target) {
          panel.targets.push({
            target: target
          });
        });

        currentRow.panels.push(panel);
      });

      dashboard.dash_load(newDashboard);
    }

  });

});