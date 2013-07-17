$(document).ready(function() {
  preload = new Image()
  preload.src = "/images/caution.png"
  Mortar.IllustrateWatcher.onSuccess(function(data) {
    Mortar.ErrorPanel.clearError();
    Mortar.IllustrateViewer.update(data);
  });

  Mortar.IllustrateWatcher.onFailure(function(data) {
    Mortar.ErrorPanel.showError('error', data['error_message'] );
  });

  Mortar.IllustrateWatcher.workStarted(function() {
    $("#activity-monitor").show();
  });

  Mortar.IllustrateWatcher.workFinished(function() {
    $("#activity-monitor").hide();
  });

  Mortar.IllustrateWatcher.onConnectionLost(function() {
    Mortar.ErrorPanel.showError('warn', "Lost Connection to Local Pig Server!");
    $("#activity-monitor").hide();
  });

  Mortar.IllustrateWatcher.start();
});

