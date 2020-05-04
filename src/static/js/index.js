'use strict';

import '../css/style.css';

$(document).ready(function () {
  $('.toggle').on('click', function (e) {
    const selector = e.target.getAttribute('data-toggle-target');
    $(selector).toggle(200);
    e.preventDefault();
  });

  $('.ajax').on('click', function (e) {
    e.target.outerHTML = 'Wait...';

    $.ajax({
      method: e.target.getAttribute('data-ajax-method'),
      url: e.target.getAttribute('data-ajax-target'),
    })
      .done(function () {
        location.reload();
      })
      .fail(function (xhr, status, error) {
        alert(`Unable to perform requested action - ${error}`);
      });

    e.preventDefault();
  });
});
