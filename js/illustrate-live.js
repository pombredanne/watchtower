// 
//  Copyright 2013 Mortar Data Inc.
// 
//  Licensed under the Apache License, Version 2.0 (the "License");
//  you may not use this file except in compliance with the License.
//  You may obtain a copy of the License at
// 
//      http://www.apache.org/licenses/LICENSE-2.0
// 
//  Unless required by applicable law or agreed to in writing, software
//  distributed under the License is distributed on an "AS IS" BASIS,
//  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//  See the License for the specific language governing permissions and
//  limitations under the License.
// 

$(document).ready(function() {
  preload = new Image()
  preload.src = "/images/caution.png"
  Mortar.IllustrateWatcher.onSuccess(function(data) {
    Mortar.ErrorPanel.clearError();
      Mortar.IllustrateViewer.update(data);
    try {
    } catch (err) {
      Mortar.ErrorPanel.showError('error', err)
    }
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

