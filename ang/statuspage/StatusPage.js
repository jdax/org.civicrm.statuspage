(function(angular, $, _) {

  angular.module('statuspage').config(function($routeProvider) {
      $routeProvider.when('/status', {
        controller: 'StatuspageStatusPage',
        templateUrl: '~/statuspage/StatusPage.html',

        // If you need to look up data when opening the page, list it out
        // under "resolve".
        resolve: {
          myContact: function(crmApi) {
            return crmApi('Contact', 'getsingle', {
              id: 'user_contact_id',
              return: ['first_name', 'last_name']
            });
          },
          statuses: function(crmApi) {
            return crmApi('System', 'check')
              .catch(function(obj){console.log(obj)})
              .then(function(apiResults){
                return _.each(apiResults.values, function(status){
                  status.displayTitle = status.name+' - '+status.title+' - '+status.severity.toUpperCase();
                });
              })
              .then(function(apiResults) {
                return _.each(apiResults.values, function(status){
                  status.showSnoozeOptions = false;
                });
              })
            ;
          }
        }
      });
    }
  );

  /**
   * remove a status after it has been hushed/snoozed
   * @param {type} $scope
   * @param {type} statusName
   * @returns void
   */
   function rmStatus($scope, statusName) {
    $scope.statuses.values =  _.reject($scope.statuses.values, function(status) {
      return status.name === statusName; // or some complex logic
    });
  }

  angular.module('statuspage').filter('trusted', function($sce){ return $sce.trustAsHtml; });

  angular.module('statuspage').controller('StatuspageStatusPage', function($scope, crmApi, crmStatus, crmUiHelp, myContact, statuses) {
    // The ts() and hs() functions help load strings for this module.
    var ts = $scope.ts = CRM.ts('statuspage');
    var hs = $scope.hs = crmUiHelp({file: 'CRM/statuspage/StatusPage'}); // See: templates/CRM/statuspage/StatusPage.hlp

    // We have myContact available in JS. We also want to reference it in HTML.
    $scope.myContact = myContact;

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
    $scope.showSnoozeOptions = function(status) {
      status.showSnoozeOptions = !status.showSnoozeOptions;
    };
  });

})(angular, CRM.$, CRM._);
