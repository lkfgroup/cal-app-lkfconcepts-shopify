import { Button, DatePicker, Icon, LegacyCard, Popover, TextField } from "@shopify/polaris"
import { CalendarMajor, PlusMinor } from '@shopify/polaris-icons';
import { useCallback, useEffect, useState } from "react";
import moment from 'moment';

export default function DateSelector({ onSelectDates }) {
  const [{ month, year }, setDate] = useState({ month: new Date().getMonth(), year: new Date().getFullYear() });
  const [popoverActive, setPopoverActive] = useState(false);
  const [dateValue, setDateValue] = useState('');
  const [selectedDates, setSelectedDates] = useState({
    start: new Date('Wed Feb 07 2018 00:00:00 GMT-0500 (EST)'),
    end: new Date('Sat Feb 10 2018 00:00:00 GMT-0500 (EST)'),
  });

  const handleMonthChange = useCallback((month, year) => setDate({ month, year }), []);

  const onDateChange = () => {};

  const renderDatePicker = (selectedDates, setSelectedDates, setDateValue, setPopoverActive) => {
    return (
      <LegacyCard.Section>
        <DatePicker
          month={month}
          year={year}
          disableDatesBefore={new Date((new Date()).valueOf() - 1000*60*60*24)}
          onChange={(e) => {
            if (e.end.getDate() === e.start.getDate()) {
              setDateValue(moment(e.start).format('dddd, MMMM DD, YYYY'));
            } else {
              setDateValue(
                `${moment(e.start).format('dddd, MMMM DD, YYYY')} to ${moment(e.end).format('dddd, MMMM DD, YYYY')}`
              );
              setPopoverActive(false);
            }
            setSelectedDates(e);
          }}
          onMonthChange={handleMonthChange}
          selected={selectedDates}
          allowRange
        />
      </LegacyCard.Section>
    );
  };

  useEffect(() => {
    onSelectDates(selectedDates);
  }, [selectedDates])

  return (
    <Popover
      active={popoverActive}
      activator={
        <TextField
          autoComplete="off"
          value={dateValue}
          onChange={onDateChange}
          onFocus={() => setPopoverActive(true)}
          placeholder="Select a date ..."
          prefix={<Icon source={CalendarMajor} />}
        />
      }
      onClose={() => setPopoverActive(false)}
    >
      {renderDatePicker(selectedDates, setSelectedDates, setDateValue, setPopoverActive)}
    </Popover>
  )
}