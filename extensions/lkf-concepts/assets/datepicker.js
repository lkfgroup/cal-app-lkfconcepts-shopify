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
    $(".datepicker__input input, .datepicker__input select").prop('disabled', true);
    $(".datepicker__input #check_availability").attr("disabled", true); 
  }
  function enableInputs() {
    $(".datepicker__input input, .datepicker__input select").prop('disabled', false);
    $(".datepicker__input #check_availability").attr("disabled", false);
  }
  function enableCheck() {
    var booking_date = $("#lkf-datepicker-container input.arrival_date").val();
    var booking_time = $("#lkf-datepicker-container select.arrival_time").val();
    if (booking_date && booking_time) {
      $(".datepicker__input #check_availability").attr("disabled", false);
      $(".datepicker__input #check_availability").html("Check Availability");
      $(".datepicker__input #check_availability").removeClass("btn--secondary");
    }
  }
  function disableAddToCart() {
    disableInputs();
    $("form[action*='/cart/add'][method='POST']").find("button.add-to-cart, button[type='submit'][name='add']").attr("disabled", true);
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
    if ($("form[action*='/cart/add'] input[name='properties[Booking discount]']").length == 0) {
      $("form[action*='/cart/add']").append(`
        <input type="hidden" name="properties[Booking discount]" />
      `);
    }
    let booking_date = $("#lkf-datepicker-container input.arrival_date").val();
    let booking_time = $("#lkf-datepicker-container select.arrival_time").val();
    if (booking_date) {
      var dateobj = new Date($("#lkf-datepicker-container .datepicker").datepicker("getDate"));
      var selectedMonth = dateobj.getMonth();
      var selectedDay = dateobj.getDate() ;
      var selectedYear = dateobj.getFullYear();
      $(document).find(`.ui-datepicker-calendar td[data-month="${selectedMonth}"][data-year="${selectedYear}"]`).each(function() {
        if ($(this).find(`[data-date="${selectedDay}"]`)) {
          var booking_discount = $(this).find(".amount_lkf").text();
          if (booking_discount) {
            console.log("booking_discount", booking_discount)
            $(document).find('input[name="properties[Booking discount]"]').val(booking_discount);
          }
          return false;
        }
      });
    }
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
  function checkBlockDateTimes(time, date, blockDates) {
    let blockDate = blockDates.find(d => d.date == date);
    if (!blockDate) {
      return true;
    }
    let times = blockDate.times;
    if (times.length > 0 && !times.includes(time)) {
      return true;
    }
    return false;
  }
  function checkLocationTime(time, date) {
    var dayLabel = jQuery.datepicker.formatDate("DD", new Date(date)).toString().toLowerCase();
    if (!window?.lkfDataLocation || !window?.lkfDataLocation?.settings || !window?.lkfDataLocation?.settings?.delivery) {
      return true;
    }
    var locationSettings = window?.lkfDataLocation?.settings?.delivery;
    var minutes = convertTimeToMinutes(time);
    if (!locationSettings.hasOwnProperty(dayLabel)) {
      console.log("a")
      return true;
    }
    if (locationSettings[dayLabel]?.time?.length == 0) {
      return false;
    }
    console.log("dayLabel", dayLabel)
    var find = locationSettings[dayLabel]?.time?.find(({ start, end }) => {
      console.log("end", end);
      console.log(convertTimeToMinutes(start), convertTimeToMinutes(end), time, minutes);
      var startMinutes = convertTimeToMinutes(start);
      var endMinutes = convertTimeToMinutes(end);
      if (endMinutes < startMinutes) {
        endMinutes += 24 * 60;
      }
      return minutes >= startMinutes && minutes <= endMinutes
    });
    if (!find) {
      return false;
    }
    console.log("b")
    return true;
  }
  function removeQuantityError() {
    $("#lkf-variant-picker .errors[data-error='quantity']").remove();
    $("#lkf-variant-picker .js-qty__wrapper .tooltiptext").remove();
  }
  function removeTimeError() {
    $("#lkf-datepicker-container .errors[data-error='time']").remove();
  }
  function renderTime(time, date, blockDates) {
    var product = window.datepickerData.product;
    var findSku = product.tags.find((tag) => tag.includes("SKU:"));
    var sku = findSku ? findSku.replace("SKU:", "") : "";
    var vendor = product.vendor.replace(" ", "").toLowerCase();
    var restaurants = [
      "HK_HK_R_LkfFumi",
      "HK_HK_R_LkfAriaItalian",
      "HK_HK_R_LkfBACI",
      "HK_HK_R_LkfKyotojoe",
      "HK_HK_R_LkfPorterhouse",
      "HK_HK_R_LkfTokiojoe",
      "HK_HK_R_LkfFumiJoe"
    ];
    var restaurant = restaurants.find((item) => {
      return item.toLowerCase().includes(vendor)
    });
    var cover = 0;
    $("#lkf-variant-picker .js-qty__wrapper input.js-qty__num").each(function() {
      cover += parseInt($(this).val());
    })
    removeQuantityError();
    removeTimeError();
    if (cover == 0) {
      $("#lkf-variant-picker").prepend(`
        <div class="errors" data-error="quantity">
          <p>${window?.Shopify?.locale == "zh-TW" ? "請選擇人數" : "Please select quantity"}</p>
        </div>
      `);
      $("#lkf-variant-picker .js-qty__wrapper:first").find("input.js-qty__num").focus();
      var x = $("#lkf-variant-picker .js-qty__wrapper:first").find("input.js-qty__num").offset().top - 200;
      $("html, body").animate({ scrollTop: x }, 500);
      $("#lkf-variant-picker .js-qty__wrapper:first").append(`
        <div class="tooltiptext">
          ${window?.Shopify?.locale == "zh-TW" ? "請選擇人數" : "Please select quantity"}
        </div>
      `);
      return;
    } else {
      removeQuantityError();
    }
    var payload = {
      shop: Shopify.shop,
      product_id: sku ? sku : product.id,
      date,
      cover,
      restaurant_id: restaurant,
      vendor: product.vendor
    };
    console.log("payload", payload)
    if (
      payload.date &&
      payload.cover &&
      payload.restaurant_id
    ) {
      $.ajax({
        url: url + "/api/check_availability",
        type: "POST",
        dataType: "JSON",
        data: payload,
        success: function (response) {
          var times = response.data;
          if (times?.length > 0) {
            var options = times.map((time) => {
              return `<option value="${time}">${time}</option>`;
            })
            $(document).find(".arrival_time option").remove();
            $(document).find("#lkf-datepicker-container select.arrival_time").prop("disabled", false);
            $(document).find(".arrival_time").each(function (ind, elem) {
              $(this).append(options.join(""));
            });
            $(document).find("#lkf-datepicker-container select.arrival_time").val(times[0]).trigger("change");
          } else {
            $("#lkf-datepicker-container .datepicker__inner").append(`
              <div class="errors" data-error="time">
                ${window?.Shopify?.locale == "zh-TW" ? "抱歉! 訂座已滿。請選擇其他日期" : "Fully Booked Sorry! Please Select Different Date"}
              </div>
            `);
            $(document).find(".arrival_time option").remove();
            $(document).find("#lkf-datepicker-container select.arrival_time").prop("disabled", true);
          }
        }
      });
    }
  }
  function renderTimeOld(time, date, blockDates) {
    let addElement = ``;
    let dayLabel = jQuery.datepicker
      .formatDate("DD", new Date())
      .toString()
      .toLowerCase();
    const dateNow = getNowYYMMDD();
    const timeNowHHMM = getNowHHMM();
    const minutesNowHHM = convertTimeToMinutes(timeNowHHMM) + 30;
    let dateYYMMDD = getNowYYMMDD(date);
    time = time.filter(t => checkBlockDateTimes(t, dateYYMMDD, blockDates));
    if (window?.lkfDataLocation && window?.lkfDataLocation?.settings && window?.lkfDataLocation?.settings?.delivery) {
      time = time.filter(t => checkBlockDateTimes(t, dateYYMMDD, window?.lkfDataLocation?.settings?.delivery?.block_dates));
    }
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
        console.log("check1", checkLocationTime(itemTime, dayLabel))
        if (minutes > minutesNowHHM && minutes > _preparationTime.value && checkLocationTime(itemTime, date)) {
          addElement += `<option value="${itemTime}">${itemTime}</option>`;
        } else {
          addElement += `<option value="${itemTime}" disabled>${itemTime}</option>`;
        }
      }
    } else {
      for (let i = 0; i < time.length; i++) {
        const itemTime = time[i];
        const minutes = convertTimeToMinutes(itemTime);
        console.log("check2", checkLocationTime(itemTime, date))
        if ((dateNow == dateYYMMDD && minutes < minutesNowHHM) || !checkLocationTime(itemTime, date)) {
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
  function getDateDiscount(date, day, { discount, discount_choices, discount_amount }, rolling_discount_list) {
    if (discount_choices?.includes("exclude_date") && discount?.exclude_dates?.includes(date)) {
      return 0;
    }
    if (discount_choices?.includes("rolling_days") && rolling_discount_list?.length > 0) {
      let find = rolling_discount_list.find((i) => i.date == date);
      if (find && find.hasOwnProperty("discount")) {
        return find.discount;
      }
      // let differentDays = Math.round((new Date(date) - new Date()) / (1000 * 60 * 60 * 24));
      // let rollingDay = discount?.rolling_days?.find((r) => r.days == differentDays);
      // if (rollingDay && Number(rollingDay?.amount) > 0) {
      //   return rollingDay?.amount;
      // }
    }
    if (discount_choices?.includes("specific_date")) {
      let specific_date = discount?.specific_dates?.find((d) => d.date == date);
      if (specific_date && Number(specific_date?.amount) > 0) {
        return specific_date?.amount;
      }
    }
    if (discount_choices?.includes("specific_day") && Number(discount[day]) > 0) {
      return discount[day];
    }
    if (discount_choices?.includes("every_day") && Number(discount_amount) > 0) {
      return discount_amount
    }
    return 0;
  }
  function appendPrice(dataProduct, month, year, rolling_discount_list) {
    let discount = dataProduct.discount;
    let discount_choices = dataProduct.discount_choices;
    let priceOld = product.price;
    const moneyFormat = window.datepickerData.moneyFormat;
    setTimeout(function () {
      $(document)
        .find(".ui-datepicker-calendar td")
        .each(function (idx, elem) {
          if ($(elem).attr('class').split(/\s+/).includes("ui-datepicker-unselectable")) {
            if ($(this).find(".amount_lkf").length == 0) {
              $(this).append(
                `<span class="amount_lkf" style='display: block;color: rgba(0,0,0,.5);font-size: 16px;font-style: italic;'>&nbsp;</span>`
              );
            }
            return;
          }
          const elemDay = $(elem).find(".ui-state-default");
          let date, day;
          let price = priceOld;
          let discountAmount;
          if (elemDay.length > 0) {
            elemDay.each(function (ind2, elem2) {
              date = getDate($(elem2).text(), month, year).date;
              day = getDate($(elem2).text(), month, year).dayLabel;
              discountAmount = getDateDiscount(date, day, dataProduct, rolling_discount_list)
              price = (priceOld * (100 - parseInt(discountAmount))) / 100;
            });
          }
          price = formatMoney(price.toString(), moneyFormat);
          if ($(this).find(".amount_lkf").length == 0 && date) {
            $(this).append(
              `<span class="amount_lkf" style='display: block;color: rgba(0,0,0,.5);font-size: 16px;font-style: italic;'>${discountAmount > 0 ? discountAmount + "%" : "&nbsp;"}</span>`
            );
          }
        });
    }, 0);
  }
  function checkReverseBlockDates(
    date,
    reverse_block_dates,
    availability,
    blockDates,
    specificDates
  ) {
    if (window?.lkfDataLocation && window?.lkfDataLocation?.settings && window?.lkfDataLocation?.settings?.delivery) {
      var locationSettings = window?.lkfDataLocation?.settings?.delivery;
      var dayOfWeek = jQuery.datepicker.formatDate("DD", date).toString().toLowerCase();
      if (locationSettings.hasOwnProperty(dayOfWeek) && !locationSettings[dayOfWeek].enabled) {
        return false;
      }
    }
    var string = jQuery.datepicker.formatDate("yy-mm-dd", date);
    if (availability == "specific_date") {
      return specificDates.includes(string);
    } else {
      return ! blockDates.includes(string);
    }
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
  function datePicker(dataAPI, blockDates, specificDates) {
    var hasAvailableDate = false;
    var currentDate = new Date();
    var startDate = currentDate;
    var checkMonth = currentDate.getMonth();
    var checkYear = currentDate.getFullYear();

    var rolling_discount_list = [];
    if (dataAPI?.discount_choices?.includes("rolling_days") && dataAPI?.discount?.rolling_days?.length > 0) {
      let lastDate = new Date();
      dataAPI?.discount?.rolling_days?.forEach((rolling_day) => {
        let i = 0;
        while (i < rolling_day.days) {
          rolling_discount_list.push({
            date: jQuery.datepicker.formatDate("yy-mm-dd", lastDate),
            discount: rolling_day.amount
          })
          lastDate.setDate(lastDate.getDate() + 1);
          i += 1;
        }
      })
    }
    console.log("rolling_discount_list", rolling_discount_list)

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
        var _checkReverseBlockDates = checkReverseBlockDates(
          date,
          dataAPI.reverse_block_dates,
          dataAPI.availability,
          blockDates,
          specificDates
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
        // checkYear += 1;
      }
    }

    $("#lkf-datepicker-container .datepicker").datepicker({
      inline: true,
      altFormat: "M d, yy",
      dateFormat: "yy-mm-dd",
      changeMonth: true,
      minDate: startDate,
      beforeShow: function (elem, dp) {
        $(".datepicker__input").attr("disabled", true);
      },
      beforeShowDay: function (date) {
        var _checkReverseBlockDates = checkReverseBlockDates(
          date,
          dataAPI.reverse_block_dates,
          dataAPI.availability,
          blockDates,
          specificDates
        );

        var _checkEnableDay = activeDay(date, dataAPI);

        return [_checkReverseBlockDates && _checkEnableDay && window.lkfDataLocation];
      },
      onChangeMonthYear: function (year, month) {
        // appendPrice(dataAPI, year, month);
      },
      onUpdateDatepicker: function (instant) {
        let month = instant.selectedMonth + 1;
        let year = instant.selectedYear;
        appendPrice(dataAPI, month, year, rolling_discount_list);
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
          renderTime(dateSlots, date, dataAPI.block_dates);
        } else {
          if (
            dataAPI["available_slot"].length > 0 &&
            dataAPI["available_slot"][0]
          ) {
            renderTime(dataAPI["every_day"].time, date, dataAPI.block_dates);
          } else {
            let getDay = jQuery.datepicker
              .formatDate("DD", new Date(date))
              .toString()
              .toLowerCase();
            if (dataAPI[getDay]) {
              renderTime(dataAPI[getDay].time, date, dataAPI.block_dates);
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

  let url = "https://cal-app.lkfconcepts.com";
  // disableInputs();
  disableAddToCart();
  let advanced_notice = {};
  const product = window.datepickerData.product;
  const findSku = product.tags.find((tag) => tag.includes("SKU:"));
  const sku = findSku ? findSku.replace("SKU:", "") : "";
  $.ajax({
    url: url + "/api/store_front",
    type: "POST",
    dataType: "JSON",
    data: {
      shop: Shopify.shop,
      product_id: sku ? sku : product.id,
      vendor: product?.vendor ? product?.vendor : ""
    },
    success: function (response) {
      if (response.success) {
        window.lkfDataLocation = response.data?.location;
        var dataAPI = response.data?.settings;
        var blockDates = []
        var specificDates = []; 
        advanced_notice = dataAPI.advanced_notice;

        if (dataAPI.reverse_block_dates) {
          specificDates = [...dataAPI.block_dates];
        } else {
          if (dataAPI?.block_dates?.length > 0) {
            blockDates = dataAPI.block_dates;
            let testBlockDate = blockDates[0]
            if (typeof testBlockDate === 'object' && testBlockDate !== null && dataAPI.reverse_block_dates == false) {
              blockDates = blockDates.filter((d) => d.times?.length == 0)
              blockDates = blockDates.map((d) => d.date);
            }
          }
        }

        if (window?.lkfDataLocation?.settings?.delivery?.block_dates?.length > 0) {
          let locationBlockDates = window?.lkfDataLocation?.settings?.delivery?.reverse_block_dates ? [] : window?.lkfDataLocation?.settings?.delivery?.block_dates;
          if (locationBlockDates?.length > 0) {
            let testBlockDate = locationBlockDates[0]
            if (typeof testBlockDate === 'object' && testBlockDate !== null) {
              locationBlockDates = locationBlockDates.filter((d) => d.times?.length == 0)
              locationBlockDates = locationBlockDates.map((d) => d.date);
              blockDates = [...blockDates, ...locationBlockDates];
            }
          }
        }

        console.log("blockDates", blockDates)

        datePicker(dataAPI, blockDates, specificDates);

        var queryString = window.location.search;
        var urlParams = new URLSearchParams(queryString);

        var date = urlParams.get("date");
        var time = urlParams.get("time");

        if (date) {
          $("#lkf-datepicker-container .datepicker").datepicker("setDate", date);
          $(".ui-datepicker-current-day").click();
        }

        if (time && $(`#lkf-datepicker-container .arrival_time option[value="${time}"]`)?.length > 0) {
          $(`#lkf-datepicker-container .arrival_time option[value="${time}"]`).attr('selected','selected');
        }

        enableInputs();

        renderVariantPicker();
      }
    },
  });

  function renderQuantityInput(variant) {
    if (window.Shopify.shop == "llkf-association.myshopify.com" || window.Shopify.shop == "ljustin-lkf-concepts-demo.myshopify.com") {
      return `
        <div class="quantity-input">
          <button type="button" class="quantity-input__button product__quantity-subtract-item" data-subtract-quantity="" aria-label="Add product quantity">
            <span class="icon icon-new icon-minus-small ">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1.5 10.75H.25v2.5H1.5v-2.5zm21 2.5h1.25v-2.5H22.5v2.5zm-21 0H12v-2.5H1.5v2.5zm10.5 0h10.5v-2.5H12v2.5z" fill="currentColor"></path></svg>
            </span>
          </button>
          <label class="visually-hidden" for="Quantity-Input-${variant.id}">Quantity</label>
          <input type="number" name="updates[]" id="Quantity-Input-${variant.id}" value="1" min="1" pattern="[0-9]*" class="quantity-input__input" data-quantity-input="" aria-label="Product quantity">
          <button type="button" class="quantity-input__button product__quantity-add-item" data-add-quantity="" aria-label="Subtract product quantity">
            <span class="icon icon-new icon-plus-small ">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13.25 1.5V.25h-2.5V1.5h2.5zm-2.5 21v1.25h2.5V22.5h-2.5zM1.5 10.75H.25v2.5H1.5v-2.5zm21 2.5h1.25v-2.5H22.5v2.5zm-21 0H12v-2.5H1.5v2.5zm10.5 0h10.5v-2.5H12v2.5zM10.75 1.5V12h2.5V1.5h-2.5zm0 10.5v10.5h2.5V12h-2.5z" fill="currentColor"></path></svg>
            </span>
          </button>
        </div>
      `
    }

    return `
      <div class="js-qty__wrapper">
        <input name="${variant.id}" type="text" class="js-qty__num" value="0" min="0" pattern="[0-9]*" data-count="${variant.price > 0 ? 1 : 0}">
        <button type="button" class="js-qty__adjust js-qty__adjust--minus">
          <svg aria-hidden="true" focusable="false" role="presentation" class="icon icon-minus" viewBox="0 0 20 20"><path fill="#444" d="M17.543 11.029H2.1A1.032 1.032 0 0 1 1.071 10c0-.566.463-1.029 1.029-1.029h15.443c.566 0 1.029.463 1.029 1.029 0 .566-.463 1.029-1.029 1.029z"/></svg>
          <span class="icon__fallback-text" aria-hidden="true">&minus;</span>
        </button>
        <button type="button" class="js-qty__adjust js-qty__adjust--plus">
          <svg aria-hidden="true" focusable="false" role="presentation" class="icon icon-plus" viewBox="0 0 20 20"><path fill="#444" d="M17.409 8.929h-6.695V2.258c0-.566-.506-1.029-1.071-1.029s-1.071.463-1.071 1.029v6.671H1.967C1.401 8.929.938 9.435.938 10s.463 1.071 1.029 1.071h6.605V17.7c0 .566.506 1.029 1.071 1.029s1.071-.463 1.071-1.029v-6.629h6.695c.566 0 1.029-.506 1.029-1.071s-.463-1.071-1.029-1.071z"/></svg>
          <span class="icon__fallback-text" aria-hidden="true">+</span>
        </button>
      </div>
    `
  }

  function renderVariantPicker() {
    try {
      var product = JSON.parse($("script#lkf-product-data").html());
      var options = JSON.parse($("script#lkf-product-options").html());
      var person_option = options.find((o) => o.name == "Per Person" || o.name == "每位" || o.name == "成人/小童");
      var groups = person_option.values.map((value) => {
        var person = value;
        var variants = product.variants.filter((variant) => variant.option1 == person);
        return {
          person,
          variants
        }
      })
      var rows = groups.map((group) => {
        if (group.variants.length > 1) {
          var variants = group.variants.map((variant) => {
            return `
              <tr class="person-sub-row" data-variant-id="${variant.id}">
                <td width="50%">
                  <span class="hide medium-up--show">${variant.option2}</span>
                  <span class="show medium-up--hide">${variant.option2} - ${formatMoney(variant.price, window.lkfData.moneyFormat)}</span>
                </td>
                <td width="25%">${formatMoney(variant.price, window.lkfData.moneyFormat)}</td>
                <td width="25%">
                  ${renderQuantityInput(variant)}
                </td>
              </tr>
            `
          })
          return `
            <tr class="person-row">
              <td colspan="3">${group.person}</td>
            </tr>
            ${variants.join("")}
          `
        } else {
          var variant = group.variants[0];
          return `
            <tr>
              <td width="50%">
                <span class="hide medium-up--show">${group.person}</span>
                <span class="show medium-up--hide">${group.person} - ${formatMoney(variant.price, window.lkfData.moneyFormat)}</span>
              </td>
              <td width="25%">${formatMoney(variant.price, window.lkfData.moneyFormat)}</td>
              <td width="25%">
                ${renderQuantityInput(variant)}
              </td>
            </tr>
          `
        }
      })
      $("#lkf-variant-picker").append(`
        <table>
          <thead>
            <tr>
              <th><strong>${window?.Shopify?.locale == "zh-TW" ? "訂座" : "Booking for"}</strong></th>
              <th><strong>${window?.Shopify?.locale == "zh-TW" ? "訂金" : "Deposit"}</strong></th>
              <th><strong>${window?.Shopify?.locale == "zh-TW" ? "訂座人數" : "Quantity"}</strong></th>
            </tr>
          </thead>
          <tbody>
            ${rows.join("")}
          </tbody>
        </table>
      `);
      document.querySelectorAll("#lkf-variant-picker .js-qty__wrapper").forEach(el => {
        new window.datepickerUtils.QtySelector(el, {
          namespace: '.product'
        });
      });
    } catch (error) {
      
    }
  }

  function formatMoney (cents, format) {
    if (typeof cents == 'string') { cents = cents.replace('.', ''); }
    var defaultMoneyFormat = "${{amount}}"
    var value = '';
    var placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;
    var formatString = (format || defaultMoneyFormat);

    function defaultOption(opt, def) {
      return (typeof opt == 'undefined' ? def : opt);
    }
    function formatWithDelimiters(number, precision, thousands, decimal) {
      precision = defaultOption(precision, 2);
      thousands = defaultOption(thousands, ',');
      decimal = defaultOption(decimal, '.');

      if (isNaN(number) || number == null) { return 0; }

      number = (number / 100.0).toFixed(precision);

      var parts = number.split('.'),
        dollars = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1' + thousands),
        cents = parts[1] ? (decimal + parts[1]) : '';

      return dollars + cents;
    }

    switch (formatString.match(placeholderRegex)[1]) {
      case 'amount':
        value = formatWithDelimiters(cents, 2);
        break;
      case 'amount_no_decimals':
        value = formatWithDelimiters(cents, 0);
        break;
      case 'amount_with_comma_separator':
        value = formatWithDelimiters(cents, 2, '.', ',');
        break;
      case 'amount_no_decimals_with_comma_separator':
        value = formatWithDelimiters(cents, 0, '.', ',');
        break;
    }

    return formatString.replace(placeholderRegex, value);
  }

  $(document).on("change", "form[action*='/cart/add'] select[name='id'], input[name='quantity']", function() {
    enableCheck();
    $("form[action*='/cart/add'][method='POST']").find("button").attr("disabled", true);
  });

  $("input[name='quantity']").siblings().on("click", function () {
    enableCheck();
    $("form[action*='/cart/add'][method='POST']").find("button").attr("disabled", true);
  });

  var onChangeQuantity = function() {
    var booking_date = $("#lkf-datepicker-container .datepicker").datepicker("getDate");
    if (booking_date) {
      booking_date = jQuery.datepicker.formatDate("yy-mm-dd", new Date(booking_date));
      renderTime("", booking_date, [])
    }
  }

  $(document).on("change", "#lkf-datepicker-container .js-qty__num", onChangeQuantity);

  $(document).on("click", "#lkf-datepicker-container .js-qty__adjust", onChangeQuantity);

  $(document).on("change", "#lkf-datepicker-container select.arrival_time", function() {
    enableAddToCart();
    enableInputs();
  });

  // $("#lkf-datepicker-container #check_availability").click(function (e) {
  //   var that = this;
  //   e.preventDefault();
  //   disableAddToCart();
  //   const product = window.datepickerData.product;
  //   const findSku = product.tags.find((tag) => tag.includes("SKU:"));
  //   const sku = findSku ? findSku.replace("SKU:", "") : "";
  //   const vendor = product.vendor.replace(" ", "").toLowerCase();
  //   const restaurants = [
  //     "HK_HK_R_LkfFumi",
  //     "HK_HK_R_LkfAriaItalian",
  //     "HK_HK_R_LkfBACI",
  //     "HK_HK_R_LkfKyotojoe",
  //     "HK_HK_R_LkfPorterhouse",
  //     "HK_HK_R_LkfTokiojoe",
  //   ];
  //   const restaurant = restaurants.find((item) => {
  //     return item.toLowerCase().includes(vendor)
  //   });

  //   var cover = 0;

  //   $("#lkf-variant-picker .js-qty__wrapper input[data-count='1']").each(function() {
  //     cover += parseInt($(this).val());
  //   })

  //   const payload = {
  //     shop: Shopify.shop,
  //     product_id: sku ? sku : product.id,
  //     date: _date,
  //     time: $(document).find(".arrival_time").find(":selected").val(),
  //     cover: cover,
  //     restaurant_id: restaurant,
  //     vendor: product.vendor
  //   };
  //   if (
  //     !payload.date ||
  //     !payload.time ||
  //     !payload.cover ||
  //     !payload.restaurant_id
  //   ) {
  //     enableInputs();
  //     return;
  //   }
  //   $.ajax({
  //     url: url + "/api/check_availability",
  //     type: "POST",
  //     dataType: "JSON",
  //     data: payload,
  //     success: function (response) {
  //       if (response.available) {
  //         enableAddToCart();
  //         $(that).attr('disabled', false);
  //         $(that).addClass("btn--secondary");
  //         $(that).html(`
  //           <span>
  //             <svg width="15" height="10" viewBox="0 0 15 10" fill="none" xmlns="http://www.w3.org/2000/svg">
  //               <line x1="1.20267" y1="4.64645" x2="6.20267" y2="9.64645" stroke="#6BEE78"/>
  //               <line x1="5.49557" y1="9.64645" x2="14.4956" y2="0.646447" stroke="#6BEE78"/>
  //             </svg>          
  //           </span> Available
  //         `)
  //       } else {
  //         $(that).attr('disabled', false);
  //         $(that).addClass("btn--secondary");
  //         $(that).html(`
  //           <span>
  //             <svg width="11" height="10" viewBox="0 0 11 10" fill="none" xmlns="http://www.w3.org/2000/svg">
  //               <line x1="1.49557" y1="9.64645" x2="10.4956" y2="0.646447" stroke="#F35050"/>
  //               <line x1="1.20267" y1="0.646447" x2="10.2027" y2="9.64645" stroke="#F35050"/>
  //             </svg>
  //           </span> Unavailable
  //         `);
  //       }
  //     },
  //   });
  //   enableInputs();
  // });

  $("form[action*='/cart/add'][method='POST'] button.add-to-cart, form[action*='/cart/add'][method='POST'] button[type='submit'][name='add']").on("click", async function(e) {
    e.preventDefault();
    var items = [];
    var form = $(this).closest("form");
    $("#lkf-variant-picker .js-qty__wrapper input.js-qty__num").each(function() {
      if ($(this).val() > 0) {
        items.push({
          id: $(this).attr("name"),
          quantity: $(this).val(),
          properties: {
            "Booking date": $(form).find("input[name='properties[Booking date]']").val(),
            "Booking time": $(form).find("input[name='properties[Booking time]']").val(),
            "Booking discount": $(form).find("input[name='properties[Booking discount]']").val(),
          }
        })
      }
    })
    var formData = {
      items
    }
    var url = window.Shopify.routes.root + 'cart/add.js'
    try {
      await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })
      window.location.href = "/cart"
      return false;
    } catch(error) {
      
    }
  });
})(jQuery);