"use strict";

import "../css/style.css";

$(document).ready(function() {
  $('.toggle').on('click', function(e) {
    const selector = e.target.getAttribute('data-toggle-target');
    $(selector).toggle(200);
    e.preventDefault();
  });
});
