$(document).ready(function () {

    // Suggestion Engine => Bloodhound
    let engine = new Bloodhound({
        queryTokenizer: Bloodhound.tokenizers.whitespace,
        datumTokenizer: Bloodhound.tokenizers.obj.whitespace('fullname'),
        remote: {
            url: '/user/profile/search?key=%QUERY',
            wildcard: '%QUERY'
        }
    });


    let engineDefaults = (key, sync, async) => {
        if (key === '') {
            sync(engine.all());
            async([]);
        }
        else engine.search(key, sync, async)
    }

    $('#demo-input').typeahead({
        hint: $('.Typeahead-hint'),
        menu: $('.Typeahead-menu'),
        highlight: false,
        minLength: 0,
        classNames: {
            input: 'Typeahead-input',
            hint: 'tt-hint',
            menu: 'tt-menu',
            dataset: 'tt-dataset',
            suggestion: 'Typeahead-suggestion',
            selectable: 'Typeahead-selectable',
            empty: 'is-empty',
            open: 'is-open',
            cursor: 'is-active',
        }
    },
        {
            source: engineDefaults,
            name: 'profiles',
            display: () => '',
            limit: Number.MAX_VALUE,
            templates: {
                notFound: '<div class="EmptyMessage text-muted" style="background-color: #F2F2F2">There are no courses with this name</div>',
                pending: '<div class="EmptyMessage text-muted" style="background-color: #F2F2F2; padding: 5px">Loading...</div>',
                header: '<div class="templateHeader text-muted" style="background-color: #F2F2F2; padding: 5px">Results are found</div>',
                suggestion: (data) => {
                    return `

                    <a target="_blank" href="/course/${data._id}" style="text-decoration: none">
                        <div class="ProfileCard u-cf">
                            <img class="ProfileCard-avatar" src="../assets/centerphotos/${data.centerphoto}">
                            <div class="ProfileCard-details">
                                <div class="ProfileCard-realName">${data.coursename}</div>
                                <div class="ProfileCard-description">${data.coursebio}</div>
                            </div>
                        </div>
                    </a>
                    `
                },
                footer: '<div class="templateFooter text-muted" style="background-color: #F2F2F2; padding: 5px"> Enjoy with Teacherou &copy;</div>'
            },

        }).on('typeahead:asyncrequest', function () {
            $('.Typeahead-spinner').show();
        }).on('typeahead:asynccancel typeahead:asyncreceive', function () {
            $('.Typeahead-spinner').hide();
        });
});  

/*
    <div class="input-group mb-3">
        <div class="input-group-prepend">
            <span class="input-group-text"><i class="fas fa-pen-nib"></i></span>
        </div>
        <textarea required style="height: 100px; resize: none"
            placeholder="Enter Course Bio" id="coursebio" name="coursebio"
            class="form-control">
        </textarea>
    </div>
*/