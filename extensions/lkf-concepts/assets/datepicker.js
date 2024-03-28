(function ($) {
  let _date;

  $.extend($.datepicker, {
    // Reference the orignal function so we can override it and call it later
    _inlineDatepicker2: $.datepicker._inlineDatepicker,

    // Override the _inlineDatepicker method
    _inlineDatepicker: function (target, inst) {
      // Call the original
      this._inlineDatepicker2(target, inst);

      var beforeShow = $.datepicker._get(inst, "beforeShow");

      if (beforeShow) {
        beforeShow.apply(target, [target, inst]);
      }
    },
  });

  function disableInputs() {
    $(".datepicker__input:first-child input").attr("disabled", true);
    $(".datepicker__input:eq(1) select").prop("disabled", "disabled");
    $(".datepicker__input:eq(2)").attr("disabled", "disabled");

    $(".datepicker__input:eq(2) a").attr("disabled", true);
    $(".datepicker__input:eq(2) a").focus(function () {
      $(this).prop("disabled", true);
    });
  }
  function enableInputs() {
    $(".datepicker__input:first-child input").attr("disabled", false);
    $(".datepicker__input:eq(1) select").prop("disabled", false);
    // $(".datepicker__input:eq(2) a").attr('disabled', false)
  }
  function enableCheck() {
    var booking_date = $("#lkf-datepicker-container input.arrival_date").val();
    var booking_time = $("#lkf-datepicker-container select.arrival_time").val();
    if (booking_date && booking_time) {
      $(".datepicker__input:eq(2) a").attr("disabled", false);
      $(".datepicker__input:eq(2) a").html("Check Availability");
      $(".datepicker__input:eq(2) a").removeClass("btn--secondary");
    }
  }
  function disableAddToCart() {
    disableInputs();
    $("form[action*='/cart/add'][method='POST']")
      .find("button")
      .attr("disabled", true);
  }
  function enableAddToCart() {
    enableInputs();
    $("form[action*='/cart/add'][method='POST']").find("button").attr("disabled", false);
    if ($("form[action*='/cart/add'] input[name='properties[Booking date]']").length == 0) {
      $("form[action*='/cart/add']").append(`
        <input type="hidden" name="properties[Booking date]" />
      `);
    }
    if ($("form[action*='/cart/add'] input[name='properties[Booking time]']").length == 0) {
      $("form[action*='/cart/add']").append(`
        <input type="hidden" name="properties[Booking time]" />
      `);
    }
    let booking_date = $("#lkf-datepicker-container input.arrival_date").val();
    let booking_time = $("#lkf-datepicker-container select.arrival_time").val();
    $(document).find('input[name="properties[Booking date]"]').val(booking_date);
    $(document).find('input[name="properties[Booking time]"]').val(booking_time);
  }
  function getDate(day, month, year) {
    if (!day) {
      return;
    }
    day = day < 10 ? `0${day}` : day;
    const dateNow = new Date();
    // let month = dateNow.getMonth() + 1;
    month = month < 10 ? `0${month}` : month;
    // let year = dateNow.getFullYear();
    let date = `${year}-${month}-${day}`;
    let dayLabel = jQuery.datepicker.formatDate(
      "DD",
      new Date(`${year}-${month}-${day}`)
    );
    return { date, dayLabel: dayLabel.toString().toLowerCase() };
  }
  function convertTimeToMinutes(time) {
    let colon = time.indexOf(":");
    if (!colon) return 0;
    let hour = time.slice(0, colon);
    let minute = time.slice(colon + 1, time.length);
    return parseInt(hour) * 60 + parseInt(minute);
  }
  function getNowHHMM() {
    const dateNow = new Date();
    const hour = dateNow.getHours();
    const minutes = dateNow.getMinutes();
    return `${hour}:${minutes}`;
  }
  function renderTime(time, date) {
    let addElement = ``;
    let dayLabel = jQuery.datepicker
      .formatDate("DD", new Date())
      .toString()
      .toLowerCase();
    const dateNow = getNowYYMMDD();
    const timeNowHHMM = getNowHHMM();
    const minutesNowHHM = convertTimeToMinutes(timeNowHHMM);
    let dateYYMMDD = getNowYYMMDD(date);
    if (
      advanced_notice[dayLabel]?.format &&
      advanced_notice[dayLabel]?.format !== "days" &&
      dateYYMMDD == dateNow
    ) {
      const _preparationTime = preparationTime(
        advanced_notice[dayLabel]?.format
      );
      for (let i = 0; i < time.length; i++) {
        const itemTime = time[i];
        const minutes = convertTimeToMinutes(itemTime);
        console.log("minutes", minutes, minutesNowHHM);
        if (
          (!disableDate(dateYYMMDD, _preparationTime.date) &&
            minutes > minutesNowHHM) ||
          minutes > _preparationTime.value
        ) {
          addElement += `<option value="${itemTime}">${itemTime}</option>`;
        } else {
          addElement += `<option value="${itemTime}" disabled>${itemTime}</option>`;
        }
      }
    } else {
      for (let i = 0; i < time.length; i++) {
        const itemTime = time[i];
        const minutes = convertTimeToMinutes(itemTime);

        if (dateNow == dateYYMMDD && minutes < minutesNowHHM) {
          addElement += `<option value="${itemTime}" disabled>${itemTime}</option>`;
        } else {
          addElement += `<option value="${itemTime}">${itemTime}</option>`;
        }
      }
    }

    $(document).find(".arrival_time option").remove();
    $(document)
      .find(".arrival_time")
      .each(function (ind, elem) {
        $(this).append(addElement);
      });
  }
  function formatMoney(cents, format) {
    if (typeof cents == "string") {
      cents = cents.replace(".", "");
    }
    var defaultMoneyFormat = "${{amount}}";
    var value = "";
    var placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;
    var formatString = format || defaultMoneyFormat;

    function defaultOption(opt, def) {
      return typeof opt == "undefined" ? def : opt;
    }

    function formatWithDelimiters(number, precision, thousands, decimal) {
      precision = defaultOption(precision, 2);
      thousands = defaultOption(thousands, ",");
      decimal = defaultOption(decimal, ".");

      if (isNaN(number) || number == null) {
        return 0;
      }

      number = (number / 100.0).toFixed(precision);

      var parts = number.split("."),
        dollars = parts[0].replace(
          /(\d)(?=(\d\d\d)+(?!\d))/g,
          "$1" + thousands
        ),
        cents = parts[1] ? decimal + parts[1] : "";

      return dollars + cents;
    }

    switch (formatString.match(placeholderRegex)[1]) {
      case "amount":
        value = formatWithDelimiters(cents, 2);
        break;
      case "amount_no_decimals":
        value = formatWithDelimiters(cents, 0);
        break;
      case "amount_with_comma_separator":
        value = formatWithDelimiters(cents, 2, ".", ",");
        break;
      case "amount_no_decimals_with_comma_separator":
        value = formatWithDelimiters(cents, 0, ".", ",");
        break;
    }

    return formatString.replace(placeholderRegex, value);
  }
  function appendPrice(dataProduct, month, year) {
    let discount = dataProduct.discount;
    let discount_choices = dataProduct.discount_choices;
    let priceOld = product.price;
    const moneyFormat = window.datepickerData.moneyFormat;
    setTimeout(function () {
      $(document)
        .find(".ui-datepicker-calendar td")
        .each(function (idx, elem) {
          const elemDay = $(elem).find(".ui-state-default");
          let date, day;
          let price = priceOld;
          let discountAmount = dataProduct?.discount_amount ? dataProduct?.discount_amount : 0;
          if (elemDay.length > 0) {
            elemDay.each(function (ind2, elem2) {
              date = getDate($(elem2).text(), month, year).date;
              day = getDate($(elem2).text(), month, year).dayLabel;
              if (
                discount_choices.length > 0 &&
                discount_choices[0] !== "specific_date"
              ) {
                if (discount[day]) {
                  price = (priceOld * (100 - parseInt(discount[day]))) / 100;
                  discountAmount = parseInt(discount[day]);
                }
              } else {
                const specificDate = discount.specific_dates.find(
                  (item) => item.date == date
                );
                if (specificDate?.date && specificDate?.amount) {
                  // price = (priceOld * (100 - parseInt(specificDate.amount))) / 100;
                  discountAmount = parseInt(specificDate.amount);
                }
              }
            });
          }
          price = formatMoney(price.toString(), moneyFormat);
          if ($(this).find("#amount_lkf").length == 0 && date) {
            $(this).append(
              `<span id="amount_lkf" style='display: block;color: rgba(0,0,0,.5);font-size: 16px;font-style: italic;'>${discountAmount > 0 ? discountAmount + "%" : "&nbsp;"}</span>`
            );
          }
        });
    }, 0);
  }
  function checkReverseBlockDates(
    date,
    reverse_block_dates,
    availability,
    blockDates
  ) {
    var string = jQuery.datepicker.formatDate("yy-mm-dd", date);
    var isDisplay = blockDates.indexOf(string) == -1; // not in blockDates
    if (reverse_block_dates == true && availability == "specific_date") {
      return !isDisplay;
    }
    if (reverse_block_dates == false) {
      return isDisplay;
    }
    return true;
  }
  function getNowYYMMDD(date) {
    if (!date) date = new Date();
    let dataYYMMDD = jQuery.datepicker.formatDate("yy-mm-dd", new Date(date));
    return dataYYMMDD;
  }
  function activeDay(date, dataProduct) {
    var getDay = jQuery.datepicker
      .formatDate("DD", date)
      .toString()
      .toLowerCase();
    let dayLabel = jQuery.datepicker
      .formatDate("DD", new Date())
      .toString()
      .toLowerCase();

    // check thời gian bị lùi lại bằng advanced_notice
    if (advanced_notice[dayLabel]?.format == "days") {
      const _preparationTime = preparationTime(
        advanced_notice[dayLabel]?.format
      );
      let dataYYMMDD = getNowYYMMDD(date);
      return (
        dataProduct[getDay]?.enabled &&
        !disableDate(dataYYMMDD, _preparationTime.value)
      );
    }

    // check day disable if no option time enabled
    // if (!advanced_notice[dayLabel]?.value) {
    //   return dataProduct[getDay]?.enabled;
    // }
    // if (
    //   advanced_notice[dayLabel]?.format == "minutes" ||
    //   advanced_notice[dayLabel]?.format == "hours"
    // ) {
    //   let getDay = jQuery.datepicker
    //     .formatDate("DD", new Date(date))
    //     .toString()
    //     .toLowerCase();
    //   let time =
    //     dataProduct["availability"] == "every_day"
    //       ? dataProduct["every_day"].time
    //       : dataProduct[getDay].time;
    //   const _preparationTime = preparationTime(
    //     advanced_notice[dayLabel]?.format
    //   );
    //   let dataYYMMDD = getNowYYMMDD(date);

    //   let enable = false;
    //   // if (!disableDate(dataYYMMDD, _preparationTime.date)) {
    //   //   return false;
    //   // }
    //   console.log("time", time);
    //   for (let i = 0; i < time.length; i++) {
    //     const itemTime = time[i];
    //     const minutes = convertTimeToMinutes(itemTime);
    //     console.log(
    //       "minutes > _preparationTime.value",
    //       minutes,
    //       _preparationTime.value,
    //       minutes > _preparationTime.value
    //     );
    //     if (minutes > _preparationTime.value) {
    //       enable = true;
    //     }
    //   }

    //   return dataProduct[getDay]?.enabled && enable;
    // }

    // check date availability
    // if(dataProduct['availability'] == 'specific_day')
    return dataProduct[getDay]?.enabled;
  }
  function disableDate(dateOld, dateDisable) {
    // true: disable
    dateOld = new Date(dateOld);
    dateDisable = new Date(dateDisable);

    if (dateOld.getFullYear() < dateDisable.getFullYear()) {
      return true;
    }
    if (dateOld.getFullYear() > dateDisable.getFullYear()) {
      return false;
    }
    if (dateOld.getMonth() < dateDisable.getMonth()) {
      return true;
    }
    if (dateOld.getMonth() > dateDisable.getMonth()) {
      return false;
    }
    if (dateOld.getDate() <= dateDisable.getDate()) {
      return true;
    }
    if (dateOld.getDate() > dateDisable.getDate()) {
      return false;
    }
    return true;
  }

  function addDays(date, days) {
    date.setDate(date.getDate() + days - 1);
    return date;
  }
  function preparationTime(format) {
    let dayLabel = jQuery.datepicker
      .formatDate("DD", new Date())
      .toString()
      .toLowerCase();
    const date = new Date();

    if (format == "days") {
      const newDate = addDays(date, parseInt(advanced_notice[dayLabel].value));
      const newDateFormat = jQuery.datepicker.formatDate(
        "yy-mm-dd",
        new Date(newDate)
      );
      return { format: format, value: newDateFormat };
    }

    const dateFormat = getNowYYMMDD(date);
    if (format == "hours") {
      const hourCur = date.getHours();
      return {
        format: format,
        date: dateFormat,
        value: (hourCur + parseInt(advanced_notice[dayLabel].value)) * 60,
      };
    }
    if (format == "minutes") {
      const hourCur = date.getHours();
      const minutesCur = date.getMinutes();
      const newMinutesFormat =
        minutesCur + parseInt(advanced_notice[dayLabel].value);
      const minutes = hourCur * 60 + newMinutesFormat;
      const minutesMax = 12 * 60 * 60;
      if (minutes >= minutesMax) {
        return { format: format, value: minutesMax };
      }
      return { format: format, date: dateFormat, value: minutes };
    }
  }
  function datePicker(dataAPI, blockDates) {
    var hasAvailableDate = false;
    var currentDate = new Date();
    var startDate = currentDate;
    var checkMonth = currentDate.getMonth();
    var checkYear = currentDate.getFullYear();

    function getDaysInMonth(month, year) {
      var date = new Date(year, month, 1);
      var days = [];
      while (date.getMonth() === month) {
        days.push(new Date(date));
        date.setDate(date.getDate() + 1);
      }
      return days;
    }

    while (hasAvailableDate != true) {
      var daysInMonth = getDaysInMonth(checkMonth, checkYear);
      for (let i = 0; i < daysInMonth.length; i++) {
        let date = daysInMonth[i];
        if (new Date(date.toDateString()) < new Date(currentDate.toDateString())) {
          continue;
        }
        var reverse_block_dates = dataAPI.reverse_block_dates;
        var availability = dataAPI.availability;
        var _checkReverseBlockDates = checkReverseBlockDates(
          date,
          reverse_block_dates,
          availability,
          blockDates
        );
        var _checkEnableDay = activeDay(date, dataAPI);
        console.log(date, _checkReverseBlockDates, _checkEnableDay)
        if (_checkReverseBlockDates && _checkEnableDay) {
          hasAvailableDate = true;
          startDate = date;
          break;
        }
      }
      if (checkMonth == 11) {
        checkMonth = 0;
        checkYear += 1;
      } else {
        checkMonth += 1;
        checkYear += 1;
      }
    }

    $("#lkf-datepicker-container .datepicker").datepicker({
      inline: true,
      altFormat: "M d",
      changeMonth: true,
      minDate: startDate,
      beforeShow: function (elem, dp) {
        $(".datepicker__input").attr("disabled", true);
      },
      beforeShowDay: function (date) {
        var reverse_block_dates = dataAPI.reverse_block_dates;
        var availability = dataAPI.availability;

        var _checkReverseBlockDates = checkReverseBlockDates(
          date,
          reverse_block_dates,
          availability,
          blockDates
        );
        var _checkEnableDay = activeDay(date, dataAPI);

        return [_checkReverseBlockDates && _checkEnableDay];
      },
      onChangeMonthYear: function (year, month) {
        // appendPrice(dataAPI, year, month);
      },
      onUpdateDatepicker: function (instant) {
        let month = instant.selectedMonth + 1;
        let year = instant.selectedYear;
        appendPrice(dataAPI, month, year);
      },
      altField: "#lkf-datepicker-container .datepicker input[type=text]",
      onSelect: function (date) {
        var dateSlots = [];
        if (dataAPI?.available_slot_specific_dates_allowed && dataAPI?.available_slot_specific_dates?.length > 0) {
          var selectedDate = jQuery.datepicker.formatDate("yy-mm-dd", new Date(date));
          var find = dataAPI?.available_slot_specific_dates?.find((v) => v.date == selectedDate);
          dateSlots = find?.slots || [];
        } 
        if (dateSlots?.length > 0) {
          renderTime(dateSlots, date);
        } else {
          if (
            dataAPI["available_slot"].length > 0 &&
            dataAPI["available_slot"][0]
          ) {
            renderTime(dataAPI["every_day"].time, date);
          } else {
            let getDay = jQuery.datepicker
              .formatDate("DD", new Date(date))
              .toString()
              .toLowerCase();
            if (dataAPI[getDay]) {
              renderTime(dataAPI[getDay].time, date);
            }
          }
        }
        _date = jQuery.datepicker.formatDate("yy-mm-dd", new Date(date));
        enableCheck();
        $("#lkf-datepicker-container .ui-datepicker-inline").hide();
      },
      startDate: new Date(startDate)
    });

    $("#lkf-datepicker-container .datepicker input[type=text]").change(
      function () {
        $("#lkf-datepicker-container .datepicker").datepicker(
          "setDate",
          $(this).val()
        );
      }
    );

    $("#lkf-datepicker-container .datepicker").datepicker("setDate", "");

    $("#lkf-datepicker-container .datepicker input[type=text]").attr(
      "readonly",
      "true"
    );

    $("#lkf-datepicker-container .ui-datepicker").addClass("notranslate");
    $("#lkf-datepicker-container .ui-datepicker").attr("translate", "no");

    $("#lkf-datepicker-container .ui-datepicker-inline").hide();

    $("#lkf-datepicker-container .datepicker input[type=text]").on(
      "click touchstart",
      function (e) {
        $("#lkf-datepicker-container .ui-datepicker-inline").show();
      }
    );

    $(document).on("mouseup touchstart", function (e) {
      // appendPrice(dataAPI);

      var isDatePickerInput = $(
        "#lkf-datepicker-container .datepicker input"
      ).is(e.target);
      var isDatePicker = $(
        "#lkf-datepicker-container .ui-datepicker-inline"
      ).is(e.target);
      var isChildOfDatePicker = $(
        "#lkf-datepicker-container .ui-datepicker-inline"
      ).has(e.target).length;

      // If the target of the click isn't the text input, the date picker, or a descendant of the date picker
      if (!isDatePickerInput && !isDatePicker && !isChildOfDatePicker) {
        $("#lkf-datepicker-container .ui-datepicker-inline").hide();
      }
    });
  }

  let url = "https://lkf-concepts.simesy.com";
  // disableInputs();
  disableAddToCart();
  let advanced_notice = {};
  const product = window.datepickerData.product;
  $.ajax({
    url: url + "/api/store_front",
    type: "POST",
    dataType: "JSON",
    data: {
      shop: Shopify.shop,
      product_id: product.id,
    },
    success: function (response) {
      if (response.success) {
        var dataAPI = response.data?.settings;
        var blockDates = dataAPI.block_dates;
        advanced_notice = dataAPI.advanced_notice;

        datePicker(dataAPI, blockDates);

        enableInputs();
      }
    },
  });

  $(document).on("change", "form[action*='/cart/add'] select[name='id'], input[name='quantity']", function() {
    enableCheck();
    $("form[action*='/cart/add'][method='POST']").find("button").attr("disabled", true);
  });

  $("input[name='quantity']").siblings().on("click", function () {
    enableCheck();
    $("form[action*='/cart/add'][method='POST']").find("button").attr("disabled", true);
  });

  $(".datepicker__input:eq(2) a").click(function () {
    let that = this;
    disableAddToCart();
    const product = window.datepickerData.product;
    const vendor = product.vendor.replace(" ", "").toLowerCase();
    const restaurants = [
      "HK_HK_R_LkfFumi",
      "HK_HK_R_LkfAriaItalian",
      "HK_HK_R_LkfCiaoChow",
      "HK_HK_R_LkfKyotojoe",
      "HK_HK_R_LkfPorterhouse",
      "HK_HK_R_LkfTokiojoe",
    ];
    const restaurant = restaurants.find((item) => {
      return item.toLowerCase().includes(vendor)
    });

    const payload = {
      shop: Shopify.shop,
      product_id: product.id,
      date: _date,
      time: $(document).find(".arrival_time").find(":selected").val(),
      cover: $("[name=quantity]").val(),
      restaurant_id:
        vendor == "baci" ? "HK_HK_R_LkfCiaoChow" : restaurant,
    };
    if (
      !payload.date ||
      !payload.time ||
      !payload.cover ||
      !payload.restaurant_id
    ) {
      enableInputs();
      return;
    }
    $.ajax({
      url: url + "/api/check_availability",
      type: "POST",
      dataType: "JSON",
      data: payload,
      success: function (response) {
        if (response.available) {
          enableAddToCart();
          $(that).attr('disabled', false);
          $(that).addClass("btn--secondary");
          $(that).html(`
            <span>
              <svg width="15" height="10" viewBox="0 0 15 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                <line x1="1.20267" y1="4.64645" x2="6.20267" y2="9.64645" stroke="#6BEE78"/>
                <line x1="5.49557" y1="9.64645" x2="14.4956" y2="0.646447" stroke="#6BEE78"/>
              </svg>          
            </span> Available
          `)
        } else {
          $(that).attr('disabled', false);
          $(that).addClass("btn--secondary");
          $(that).html(`
            <span>
              <svg width="11" height="10" viewBox="0 0 11 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                <line x1="1.49557" y1="9.64645" x2="10.4956" y2="0.646447" stroke="#F35050"/>
                <line x1="1.20267" y1="0.646447" x2="10.2027" y2="9.64645" stroke="#F35050"/>
              </svg>
            </span> Unavailable
          `);
        }
      },
    });
    enableInputs();
  });
})(jQuery);
