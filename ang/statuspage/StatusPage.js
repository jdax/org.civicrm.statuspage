(function(angular, $, _) {

  angular.module('statuspage').config( function($routeProvider) {
      $routeProvider.when('/status', {
        controller: 'statuspageStatusPage',
        templateUrl: '~/statuspage/StatusPage.html',

        resolve: {
          statuses: function(statuspageGetStatuses) {
            return statuspageGetStatuses(0);
          },
          statusModel: function(statuspageStatusModel,statuspageGetStatuses, statuspageGetPreferences) {
            return statuspageStatusModel(statuspageGetStatuses, statuspageGetPreferences)
          }
        }
      });

      $routeProvider.when('/hushed', {
        controller: 'statuspageStatusPage',
        templateUrl: '~/statuspage/StatusPage.html',

        resolve: {
          statuses: function(statuspageGetStatuses) {
            return statuspageGetStatuses(1);
          }
        }
      });
    }
  );

/**
 * get status messages
 * build snooze options object reconciled with preferences
 *
 */
  angular.module('statuspage').service('statuspageStatusModel', function(crmApi, statuspageGetStatuses, statuspageGetPreferences){
    return function() {
      var statusModel = {
        hushed: false,
        getStatuses: statuspageGetStatuses,
        getPreferences: statuspageGetPreferences,
      };
      statusModel.statuses = statusModel
        .getStatuses(statusModel.hushed)
          .then(function(result){
            result.preferences = statusModel.getPreferences();
            return result;
          })
          .then(function(result){
            CRM.log('here');
          });
    };
  });

  angular.module('statuspage').service('statuspageGetStatuses', function(crmApi, statuspageSeverityList) {
    return function(hushed) {
      return crmApi('System', 'check', { "show_hushed": hushed })
        .catch(function(obj){console.log(obj)})
        .then(function(apiResults){
          _.each(apiResults.values, function(status){
            status.severity_id = status.severity;
            status.severity = statuspageSeverityList[status.severity];
            status.displayTitle = status.name+' - '+status.title +' - '+status.severity.toUpperCase();
            status.snoozeOptions = {
              show: false,
              severity: status.severity
            };
          });
          return apiResults;
        })
      }
  });

  angular.module('statuspage').service('statuspageGetPreferences', function(crmApi) {
    return function(crmApi) {
      return crmApi('StatusPreference', 'get')
        .then(function(apiResults) {
          _.each(apiResults.values, function(pref){
            pref.snoozeOptions = {
              severity: pref.ignore_severity
            };
          });
          return apiResults;
        });
    };
  });

  /**
   * remove a status after it has been hushed/snoozed
   * @param {type} $scope
   * @param {type} statusName
   * @returns void
   */
   function rmStatus($scope, statusName) {
    $scope.statuses.values =  _.reject($scope.statuses.values,
      function(status) {
        return status.name === statusName;
    });
  }

  angular.module('statuspage').filter('trusted', function($sce){ return $sce.trustAsHtml; });

  angular.module('statuspage').directive('crmSnoozeOptions', function(statuspageSeverityList) {
    return {
      templateUrl: '~/statuspage/SnoozeOptions.html',
      transclude: true,
      link: function(scope, element, attr) {
        scope.severityList = statuspageSeverityList;
      }
    };
  });

  angular.module('statuspage').service('statuspageSeverityList', function() {
    return ['debug', 'info', 'notice', 'warning', 'error', 'critical', 'alert', 'emergency'];
  });

  angular.module('statuspage').controller('statuspageStatusPage',
    function($scope, $location, crmApi, crmStatus, crmUiHelp, statuses, crmNavigator) {
    // The ts() and hs() functions help load strings for this module.
    var ts = $scope.ts = CRM.ts('statuspage');
    var hs = $scope.hs = crmUiHelp({file: 'CRM/statuspage/StatusPage'}); // See: templates/CRM/statuspage/StatusPage.hlp

    $scope.path = $location.path();
    $scope.navigator = crmNavigator;
    $scope.statuses = statuses;

    $scope.hush = function(name, severity) {
      return  crmStatus(
        { start: ts('Saving Status Preference...')      , success: ts('Preference Saved') },
        crmApi('StatusPreference', 'create', {
          "sequential": 1,
          "name": name,
          "ignore_severity": severity
        })
        .then(function(){rmStatus($scope, name);})
      );
    }

    $scope.snooze = function(status) {
      $scope.showSnoozeOptions(status);
      return crmStatus(
        { status: ts('Saving Status Preference...')   , success: ts('Preference Saved') },
          crmApi('StatusPreference', 'create', {
            "sequential": 1,
            "name": status.name,
            "ignore_severity": status.snoozeOptions.severity,
            "hush_until": status.snoozeOptions.until
          })
      );
    };
    $scope.showSnoozeOptions = function(status) {
      status.snoozeOptions.show = !status.snoozeOptions.show;
    };
  });


})(angular, CRM.$, CRM._);
