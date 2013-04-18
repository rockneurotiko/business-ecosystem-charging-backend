
(function () {

    adminInfoRequest = function adminInfoRequest(endpoint, title) {
        $.ajax({
            type: "GET",
            url: EndpointManager.getEndpoint(endpoint),
            dataType: "json",
            success: function (response) {
                paintElementList(response, endpoint, title);
            },
            error: function (xhr) {
                var resp = xhr.responseText;
                var msg = JSON.parse(resp).message;
                MessageManager.showMessage('Error', msg);
            }
        });
    };

    // Paint marketplaces or repository info
    paintElementList = function paintElementList(elementInfo, endpoint, title) {

        $('#admin-container').empty();

        if (elementInfo.length > 0) {

            $.template('listTemplate', $('#list_template'));
            $.tmpl('listTemplate', {'title': title}).appendTo('#admin-container');

            $.template('elemTemplate', $('#element_template'));
            $.tmpl('elemTemplate', elementInfo).appendTo('#table-list');
            $('#back').click(paintElementTable);
            $('.add').click(function () {
                paintForm(endpoint, title);
            });
            $('.delete').click(function (event) {
                var clicked_elem = event.target;
                makeRemoveRequest(clicked_elem, endpoint, title)
            });
        } else {
            var msg = 'No ' + title + ' registered, you may want to register one'; 
            MessageManager.showAlertInfo(title, msg);
        }
    };

    makeRemoveRequest = function makeRemoveRequest(element, endpoint, title) {
        var name, jqObject, effectiveEndpoint, csfrToken;

        jqObject = jQuery(element);
        name = jqObject.parent().parent().find('.elem-name').text();

        effectiveEndpoint = endpoint.replace('COLLECTION', 'ENTRY');;

        csrfToken = $.cookie('csrftoken');

        $.ajax({
            headers: {
                'X-CSRFToken': csrfToken,
            },
            type: "DELETE",
            url: EndpointManager.getEndpoint(effectiveEndpoint, {'name': name}),
            dataType: 'json',
            success: function (response) {
                adminInfoRequest(endpoint, title)
            },
            error: function (xhr) {
                var resp = xhr.responseText;
                var msg = JSON.parse(resp).message;
                MessageManager.showMessage('Error', msg);
            }
        });
    };

    makeCreateRequest = function makeCreateRequest(endpoint, title) {
        var name, host;

        name = $('#elem-name').val();
        host = $('#elem-host').val();

        if (name && host) {
            var csrfToken = $.cookie('csrftoken');

            $.ajax({
                headers: {
                    'X-CSRFToken': csrfToken,
                },
                type: "POST",
                url: EndpointManager.getEndpoint(endpoint),
                dataType: 'json',
                contentType: 'application/json',
                data: JSON.stringify({
                    'name': name,
                    'host': host
                }),
                success: function (response) {

                    adminInfoRequest(endpoint, title)
                },
                error: function (xhr) {
                    var resp = xhr.responseText;
                    var msg = JSON.parse(resp).message;
                    MessageManager.showMessage('Error', msg);
                }
            });
        } else {
            var msg = 'Both fields are required';
            MessageManager.showAlertError('Error', msg);
        }

    };
    // Add marketplace
    paintForm = function paintForm(endpoint, title) {

        $('#admin-container').empty();

        $.template('formTemplate', $('#form_template'));
        $.tmpl('formTemplate', {'title': title}).appendTo('#admin-container');

        $('#back').click(function () {
            $('#message-container').empty();
            paintElementTable();
        });

        $('#request-button').click(function () {
            makeCreateRequest(endpoint, title);
        });
    };

    // Repaint initial table
    paintElementTable = function paintElementTable () {
        $('#admin-container').empty();
        $.template('adminElemTemplate', $('#admin_elem_template')); // Create the template
        $.tmpl('adminElemTemplate').appendTo("#admin-container"); // Render and append the template

        $('.show-markets').click(function() {
            adminInfoRequest('MARKET_COLLECTION', 'Marketplaces');
        });

        $('.show-rep').click(function() {
            adminInfoRequest('REPOSITORY_COLLECTION', 'Repositories');
        });

        $('.add-market').click(function() {
            paintForm('MARKET_COLLECTION', 'Marketplace');
        });

        $('.add-rep').click(function() {
            paintForm('REPOSITORY_COLLECTION', 'Repository');
        });
    };

    // Set initial listeners
    $(document).ready(paintElementTable); 
})()