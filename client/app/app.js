'use strict';


var initTime = Date.now();


angular.module('trusteesApp', [
  'ngCookies',
  'ngResource',
  'ngSanitize',
  'ngAnimate',
  'ngTouch',
  'btford.socket-io',
  'ngMaterial',
  'ui.router'
])
  .config(function ($stateProvider, $urlRouterProvider, $locationProvider, $httpProvider, $provide) {

    $urlRouterProvider.otherwise('/');

    $locationProvider.html5Mode(true);
    $httpProvider.interceptors.push('authInterceptor');


    //decorate all states so they resolve their transition class name before attempting to animate views
    //      need this to target individual transitions between two specific pages rather than always
    //      executing it on every page
    $stateProvider.decorator('data', function (state, parent) {
      state.resolve.resolvePageTransitionClasses = ['$rootScope', '$q', 'Logger', '$timeout', function($rootScope, $q, Logger, $timeout){

        var logger = Logger.getLogger('resolvePageTransitionClasses:' + state.name);
        var startTime = Date.now();
        logger.debug('resolving page transition body classes:', state.name);

        return $rootScope.resolveTransitionClasses().then(function(){
          $timeout(function(){
            logger.debug('resolving page transition body classes success:', state.name, Date.now() - startTime);
          });
          return $q.when();
        });
      }];
      return parent(state);
    });

    /**
     *
     */
    $provide.decorator('$controller', [
      '$delegate',
      function ($delegate) {
        return function(constructor, locals, later, indent) {
          if (typeof constructor === 'string') {
            locals.$scope.controllerName =  constructor;
          }
          return $delegate(constructor, locals, later, indent);
        };
      }]);

  })

  .factory('authInterceptor', function ($rootScope, $q, $cookieStore, $location) {
    return {
      // Add authorization token to headers
      request: function (config) {
        config.headers = config.headers || {};
        if ($cookieStore.get('token')) {
          config.headers.Authorization = 'Bearer ' + $cookieStore.get('token');
        }
        return config;
      },

      // Intercept 401s and redirect you to login
      responseError: function(response) {
        if(response.status === 401) {
          if ($cookieStore.get('token')) {
            $location.path('/login');
            // remove any stale tokens
            $cookieStore.remove('token');
          }
          return $q.reject(response);
        }
        else {
          return $q.reject(response);
        }
      }
    };
  })



  .run(function ($rootScope, $location, Auth, $state, Logger, $timeout, $q) {

    var environment = $('#server-config #env').text();

    if(environment === 'development'){
      Logger.setDefaulLogLevel('debug');
    }

    var logger = Logger.getLogger('trusteesApp:run');

    logger.debug('trusteesApp:run environment  : ', environment);
    $timeout(function(){ logger.debug('trusteesApp:run initDuration : ', Date.now() - initTime); });

    var resolveTransitionClassesDeferred;

    $rootScope.resolveTransitionClasses = resolveTransitionClasses;
    $rootScope.openQuickaccess = openQuickaccess;

    $rootScope.navigateTo = _.debounce(navigateTo, 20, true);
    $rootScope.logout = _.debounce(logout, 20, true);

    $rootScope.$on('$stateChangeStart', stateChangeSuccess);


    /**
     *
     * @param event
     * @param toState
     * @param toParams
     * @param fromState
     * @param fromParams
     */
    function stateChangeSuccess(event, toState, toParams, fromState, fromParams) {

      logger.debug('$stateChangeStart', Date.now(), event);

      resolveTransitionClassesDeferred = $q.defer();

      // Redirect to login if route requires auth and you're not logged in
      checkAuthOnStateChange(event, toState, toParams, fromState, fromParams);
      updatePageTransitionClasses(event, toState, toParams, fromState, fromParams);
    }

    /**
     *
     * @param event
     * @param toState
     * @param toParams
     * @param fromState
     * @param fromParams
     */
    function checkAuthOnStateChange(event, toState, toParams, fromState, fromParams){
      Auth.isLoggedInAsync(function(loggedIn) {
        if (toState.authenticate && !loggedIn) {
          $location.path('/login');
        }
      });
    }


    /**
     *
     * @param event
     * @param toState
     * @param toParams
     * @param fromState
     * @param fromParams
     */
    function updatePageTransitionClasses(event, toState, toParams, fromState, fromParams){
      $rootScope.pageTransitionFromClass = 'transitionFrom' + fromState.name;
      $rootScope.pageTransitionToClass = 'transitionTo' + toState.name;


      $timeout(function ensureClassExists(){

        var $body = $('body.' + 'transitionFrom' + fromState.name + ', body.' + 'transitionTo' + toState.name);
        if($body.length){
          $timeout(function(){
            resolveTransitionClassesDeferred.resolve();
          });
        }
        else{
          $timeout(ensureClassExists, 50);
        }
      }, 20);


    }


    /**
     *
     * @returns {*}
     */
    function resolveTransitionClasses(){
      return resolveTransitionClassesDeferred.promise;
    }


    /**
     *
     */
    function openQuickaccess(email){
      Auth.setQuickAccessUser(email);
      $state.go('quickaccess');
    }




    /**
     *
     * @param state
     */
    function navigateTo(state){
      $state.go(state);
    }

    /**
     *
     */
    function logout(){
      Auth.logout();
      $timeout(function(){
        $state.go('login');
      });
    }



  });
