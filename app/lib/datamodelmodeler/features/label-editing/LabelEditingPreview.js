import {
  remove as svgRemove
} from 'tiny-svg';
import { getLabelAttr } from './LabelUtil';

var MARKER_HIDDEN = 'djs-element-hidden';


export default function LabelEditingPreview(
    eventBus, canvas) {


  var element, gfx;

  eventBus.on('directEditing.activate', function(context) {
    var activeProvider = context.active;
    var element = activeProvider.element;

    var editedAttribute = getLabelAttr(element);
    element = element.labels.filter(label => label.labelAttribute === editedAttribute)[0] || element.label || element;


    if (element.labelTarget) {
      canvas.addMarker(element, MARKER_HIDDEN);
    }
  });


  eventBus.on([ 'directEditing.complete', 'directEditing.cancel' ], function(context) {
    var activeProvider = context.active;

    if (activeProvider) {
      canvas.removeMarker(activeProvider.element.label || activeProvider.element, MARKER_HIDDEN);
    }

    element = undefined;

    if (gfx) {
      svgRemove(gfx);

      gfx = undefined;
    }
  });
}

LabelEditingPreview.$inject = [
  'eventBus',
  'canvas'
];