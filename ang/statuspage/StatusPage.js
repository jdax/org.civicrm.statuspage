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
              .then(createStatusDisplayTitle)
            ;
          }
        }
      });
    }
  );

 /**
  * add property to results of api.System.check
  * @param {type} apiResults
  * @returns apiResults
  */
  function createStatusDisplayTitle(apiResults){
    _.each(apiResults.values, function(status){
      status.displayTitle = status.name+' - '+status.title+' - '+status.severity.toUpperCase();
    });
    return apiResults;
  }

  angular.module('statuspage').filter('trusted', function($sce){ return $sce.trustAsHtml; });

  angular.module('statuspage').controller('StatuspageStatusPage', function($scope, crmApi, crmStatus, crmUiHelp, myContact, statuses) {
    // The ts() and hs() functions help load strings for this module.
    var ts = $scope.ts = CRM.ts('statuspage');
    var hs = $scope.hs = crmUiHelp({file: 'CRM/statuspage/StatusPage'}); // See: templates/CRM/statuspage/StatusPage.hlp

    // We have myContact available in JS. We also want to reference it in HTML.
    $scope.myContact = myContact;

    $scope.statuses = statuses;

    $scope.save = function save() {
      return crmStatus(
        // Status messages. For defaults, just use "{}"
        {start: ts('Saving...'), success: ts('Saved')},
        // The save action. Note that crmApi() returns a promise.
        crmApi('Contact', 'create', {
          id: myContact.id,
          first_name: myContact.first_name,
          last_name: myContact.last_name
        })
      );
    };

    $scope.hush = function hush(name, severity) {
      return  crmStatus(
        { start: ts('Saving Status Preference...')      , success: ts('Preference Saved') },
        crmApi('StatusPreference', 'create', {
          "sequential": 1,
          "name": name,
          "ignore_severity": severity
        })
      );
    }
  });

})(angular, CRM.$, CRM._);
