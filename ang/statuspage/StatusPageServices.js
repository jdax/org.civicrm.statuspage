(function(angular, $, _) {

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
            result.preferences = statuspageGetPreferences();
//            CRM.log('here');
            return result;
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
    return function() {
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


  angular.module('statuspage').filter('trusted', function($sce){ return $sce.trustAsHtml; });

  // angular.module('statuspage').directive('crmSnoozeOptions', function(statuspageSeverityList) {
  //   return {
  //     templateUrl: '~/statuspage/SnoozeOptions.html',
  //     transclude: true,
  //     link: function(scope, element, attr) {
  //       scope.severityList = statuspageSeverityList;
  //     }
  //   };
  // });

  angular.module('statuspage').service('statuspageSeverityList', function() {
    return ['debug', 'info', 'notice', 'warning', 'error', 'critical', 'alert', 'emergency'];
  });

})(angular, CRM.$, CRM._);
