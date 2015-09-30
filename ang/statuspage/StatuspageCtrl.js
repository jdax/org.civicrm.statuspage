(function(angular, $, _) {

  angular.module('statuspage').config( function($routeProvider) {
    $routeProvider.when('/status', {
      controller: 'statuspageStatusPage',
      templateUrl: '~/statuspage/StatusPage.html',

      resolve: {
        statuses: function(statuspageGetStatuses) {
          return statuspageGetStatuses(0);
        },
        statusModel: function(statuspageStatusModel) {
          return statuspageStatusModel()
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
    };
    $scope.unhush = function(name, severity) {
      return  crmStatus(
        { start: ts('Saving Status Preference...')      , success: ts('Preference Saved') },
        crmApi('StatusPreference', 'create', {
          "sequential": 1,
          "name": name,
          "ignore_severity": 0
        })
      );
    };


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

})(angular, CRM.$, CRM._);
