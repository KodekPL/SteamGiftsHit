// ==UserScript==
// @name        SteamGifts Hit
// @description	SteamGifts Accelerant
// @author      Nandee & Kodek
// @namespace   sgh
// @include     *steamgifts.com/
// @include     *steamgifts.com/giveaways/won/
// @include     *steamgifts.com/discussions
// @versiom     1.0.2
// @downloadURL https://github.com/KodekPL/SteamGiftsHit/raw/master/script.user.js
// @updateURL   https://github.com/KodekPL/SteamGiftsHit/raw/master/script.user.js
// @run-at      document-end
// ==/UserScript==

// Apply custom style
$("body").prepend("<style>.sidebar__entry-custom {display: inline-block; margin: 0 -10px 0 -10px !important; padding: 0 8px 0 8px !important; min-width: 50px; font-family: 'Arial',sans-serif; font-size: 11px; line-height: 26px;}</style>");

// Init Variables
var xsrf = $('input[type=hidden][name=xsrf_token]').val();
var isLoggedIn = ($('.nav__sits').length > 0) ? false : true;
var username = $(".nav__avatar-outer-wrap").attr("href").replace("/user/", "");

// Init
$(document).ready(function() {
    applyFixedHeader();
    applyPointsUpdater();
    applyEnterButtonDisplay();
    applyEnterButtonFunctionality();
});

// Fixed Header
function applyFixedHeader() {
    $("header").css("position", "fixed");
    $("header").css("width", "100%");
    $("header").css("z-index", "100");
    $("header").css("top", "0");

    if ($(".featured__container").length > 0) {
        $(".featured__container").css("margin-top", "38px");
    } else {
        $(".page__outer-wrap").css("margin-top", "38px").css("right", "0");
    }
}

// Refresh Points Every Minute
function applyPointsUpdater() {
    setInterval(function() {
        $.ajax({
            url: "/ajax.php",
            type : "POST",
            dataType: "json",
            data: "xsrf_token=" + xsrf + "&do=entry_insert",
            success: function(e) {
                if($(".nav__points").text() != e.points) {
                    $(".nav__points").text(e.points);
                    updatePoints(e.points);
                }
            }
        });
    }, 60000);
}

// Giveaway Enter/Remove Apply
function applyEnterButtonDisplay() {
    $('.giveaway__row-outer-wrap').each(function() {
        var t = $(this);

        var url = t.find('.giveaway__heading__name').attr('href');
        var giveawayId = url.substring(getCharPosition(url, '/', 2) + 1, getCharPosition(url, '/', 3));

        var hasEntered = t.find('.giveaway__row-inner-wrap').hasClass('is-faded');

        var requiredPoints = Number(t.find(".giveaway__heading__thin:last").text().replace("(", "").replace(")", "").replace("P", ""));
        var activePoints = Number($(".nav__points").text());
        var hasPoints = (requiredPoints <= activePoints) ? true : false;
        var giveawayCreator = t.find(".giveaway__username").text();

        //Enter/Remove button
        if (isLoggedIn && giveawayCreator != username) {
            var displayForm = [];

            displayForm.push("<form><input type=\"hidden\" name=\"xsrf_token\" value=\"");
            displayForm.push(xsrf);
            displayForm.push("\" />");
            displayForm.push("<input type=\"hidden\" name=\"do\" value=\"\" />");
            displayForm.push("<input type=\"hidden\" name=\"code\" value=\"");
            displayForm.push(giveawayId);
            displayForm.push("\" />");
            displayForm.push("<div data-do=\"entry_insert\" class=\"sidebar__entry-custom sidebar__entry-insert");
            displayForm.push((!hasEntered && hasPoints ? "" : " is-hidden"));
            displayForm.push("\"><i class=\"fa fa-plus-circle\"></i> Enter</div>");
            displayForm.push("<div data-do=\"entry_delete\" class=\"sidebar__entry-custom sidebar__entry-delete");
            displayForm.push((hasEntered ? "" : " is-hidden"));
            displayForm.push("\"><i class=\"fa fa-minus-circle\"></i> Remove</div>");
            displayForm.push("<div class=\"sidebar__entry-custom sidebar__entry-loading is-hidden\"><i class=\"fa fa-refresh fa-spin\"></i> Wait</div>");
            displayForm.push("<div class=\"sidebar__entry-custom sidebar__error ");
            displayForm.push((!hasPoints && !hasEntered ? "" : " is-hidden"));
            displayForm.push("\">");
            displayForm.push((!hasPoints && !hasEntered ? "<i class=\"fa fa-exclamation-circle\"></i> Not enough points" : ""));
            displayForm.push("</div>");
            displayForm.push("</form>");

            t.find('.giveaway__row-inner-wrap').removeClass('is-faded');
            t.find(".giveaway__columns").append(displayForm.join(""));
        }
    });
}

// Giveaway Enter/Remove Button Function
function applyEnterButtonFunctionality() {
    $(".sidebar__entry-insert, .sidebar__entry-delete").unbind("click");

    $(document).on('click', '.sidebar__entry-insert, .sidebar__entry-delete', function() {
        var t = $(this);

        t.addClass("is-hidden");
        t.closest("form").find(".sidebar__entry-loading").removeClass("is-hidden");
        t.closest("form").find("input[name=do]").val(t.attr("data-do"));

        $.ajax({
            url : "/ajax.php",
            type : "POST",
            dataType : "json",
            data : t.closest("form").serialize(),
            success : function(e) {
                t.closest("form").find(".sidebar__entry-loading").addClass("is-hidden");

                if (e.type === "success") {
                    if (t.hasClass("sidebar__entry-insert")) {
                        t.closest("form").find(".sidebar__entry-delete").removeClass("is-hidden");
                    } else if (t.hasClass("sidebar__entry-delete")) {
                        t.closest("form").find(".sidebar__entry-insert").removeClass("is-hidden");
                    }
                }

                $(".nav__points").text(e.points);

                updatePoints(e.points);
            }
        });

    });

    $(document).on('click', '.sidebar__error', function() {
        $(this).addClass("is-hidden").parent().find(".sidebar__entry-insert").removeClass("is-hidden");
    });
}

// Utils - Get Char Position
function getCharPosition(str, char, limiter) {
    return str.split(char, limiter).join(char).length;
}

// Utils - Update Points Display
function updatePoints(activePoints) {
    if (activePoints == -1) {
        activePoints = Number($(".nav__points").text());
    }

    $('.giveaway__row-outer-wrap').each(function() {
        var t = $(this);

        var requiredPoints = Number(t.find(".giveaway__heading__thin:last").text().replace("(", "").replace(")", "").replace("P", ""));
        var hasEntered = !t.find(".sidebar__entry-delete").hasClass('is-hidden');

        if (requiredPoints > activePoints && !hasEntered) {
            t.find(".sidebar__entry-delete").addClass("is-hidden");
            t.find(".sidebar__entry-insert").addClass("is-hidden");
            t.find(".sidebar__entry-loading").addClass("is-hidden");
            t.find(".sidebar__error").removeClass("is-hidden").html('<i class="fa fa-exclamation-circle"></i> Not enough points');
        } else if (hasEntered) {
            t.find(".sidebar__entry-delete").removeClass("is-hidden");
            t.find(".sidebar__entry-insert").addClass("is-hidden");
            t.find(".sidebar__entry-loading").addClass("is-hidden");
            t.find(".sidebar__error").addClass("is-hidden");
        } else {
            t.find(".sidebar__entry-delete").addClass("is-hidden");
            t.find(".sidebar__entry-insert").removeClass("is-hidden");
            t.find(".sidebar__entry-loading").addClass("is-hidden");
            t.find(".sidebar__error").addClass("is-hidden");
        }
    });
}
