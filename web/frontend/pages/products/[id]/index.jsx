import {
  IndexTable,
  Layout,
  LegacyCard,
  Page,
  useIndexResourceState,
  Text,
  Button,
  Modal,
  ChoiceList,
  Checkbox,
  DatePicker,
  Select,
  Form,
  FormLayout,
  TextField,
  Icon,
  Popover,
  ResourceList,
  ResourceItem,
  LegacyStack,
  Spinner,
  LegacyTabs,
  IndexFilters,
  useSetIndexFiltersMode,
  EmptySearchResult,
  Pagination,
} from '@shopify/polaris';
import { CalendarMajor, PlusMinor, DeleteMajor, MobileCancelMajor } from '@shopify/polaris-icons';
import '../../../assets/style.scss';
import { timeOptions } from '../../../timeOptions';
import { useFormik } from "formik";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router";
import * as _ from 'lodash';
import moment from 'moment';

export default function ProductConfiguration({ shop, authAxios }) {
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [popoverActive, setPopoverActive] = useState(false);
  const [popoverDiscountActive, setPopoverDiscountActive] = useState(false);
  const [selectedDiscountDates, setSelectedDiscountDates] = useState({
    start: new Date('Wed Feb 07 2018 00:00:00 GMT-0500 (EST)'),
    end: new Date('Sat Feb 10 2018 00:00:00 GMT-0500 (EST)'),
  });
  const [{ month, year }, setDate] = useState({ month: new Date().getMonth(), year: new Date().getFullYear() });
  const [selectedDates, setSelectedDates] = useState({
    start: new Date('Wed Feb 07 2018 00:00:00 GMT-0500 (EST)'),
    end: new Date('Sat Feb 10 2018 00:00:00 GMT-0500 (EST)'),
  });
  const [dateValue, setDateValue] = useState('');
  const [discountDateValue, setDiscountDateValue] = useState(null);
  const [discountAmountValue, setDiscountAmountValue] = useState('');
  const [selectedTab, setSelectedTab] = useState(0);
  const [showModalDiscount, setShowModalDiscount] = useState(false);
  const [product, setProduct] = useState({})

  const formik = useFormik({
    initialValues: {
      delivery: {
        discount: {
          monday: '',
          tuesday: '',
          wednesday: '',
          thursday: '',
          friday: '',
          saturday: '',
          sunday: '',
          specific_dates: [],
        },
        discount_amount: 0,
        discount_choices: ['every_day'],
        block_dates: [],
        reverse_block_dates: false,
        available_slot: [true],
        availability: ['every_day'],
        advanced_notice: {
          monday: {
            format: 'hours',
            value: 0,
          },
          tuesday: {
            format: 'hours',
            value: 0,
          },
          wednesday: {
            format: 'hours',
            value: 0,
          },
          thursday: {
            format: 'hours',
            value: 0,
          },
          friday: {
            format: 'hours',
            value: 0,
          },
          saturday: {
            format: 'hours',
            value: 0,
          },
          sunday: {
            format: 'hours',
            value: 0,
          },
        },
        every_day: {
          time: ['9:00'],
        },
        monday: {
          enabled: true,
          time: ['9:00'],
        },
        tuesday: {
          enabled: true,
          time: ['9:00'],
        },
        wednesday: {
          enabled: true,
          time: ['9:00'],
        },
        thursday: {
          enabled: true,
          time: ['9:00'],
        },
        friday: {
          enabled: true,
          time: ['9:00'],
        },
        saturday: {
          enabled: true,
          time: ['9:00'],
        },
        sunday: {
          enabled: true,
          time: ['9:00'],
        },
      },
    },
  });

  const handleSubmit = async () => {
    setLoading(true);
    await authAxios.post('/api/edit-settings', { ...formik.values, product_id: params.id, shop });
    setLoading(false);
  };

  const handleChange = (value, id) => {
    if (id === 'delivery.availability') {
      if (value[0] === 'every_day') {
        const updatedDelivery = _.mapValues(formik.values.delivery, (day) => {
          const { enabled, ...rest } = day;
          return enabled !== undefined ? { ...rest, enabled: true } : day;
        });
        formik.setValues({
          ...formik.values,
          delivery: updatedDelivery,
        });
      }
      if (value[0] === 'specific_date') {
        const updatedDelivery = _.mapValues(formik.values.delivery, (day) => {
          const { enabled, ...rest } = day;
          return enabled !== undefined ? { ...rest, enabled: false } : day;
        });
        formik.setValues({
          ...formik.values,
          delivery: updatedDelivery,
        });
        formik.setFieldValue('delivery.reverse_block_dates', true);
        formik.setFieldValue('delivery.block_dates', []);
      } else {
        formik.setFieldValue('delivery.reverse_block_dates', false);
        formik.setFieldValue('delivery.block_dates', []);
      }
    }
    if (id === 'delivery.discount_choices') {
      const resetDiscount = _.mapValues(formik.values.delivery.discount, (day) => {
        return typeof day === 'string' ? '' : [];
      });
      formik.setFieldValue('delivery.discount', resetDiscount);
    }
    formik.handleChange({
      target: {
        id,
        value,
      },
    });
  };

  const renderCheckbox = () => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
        <p>Select delivery days:</p>
        {tabs.map(({ id, panelID }) => {
          return (
            <Checkbox
              key={id}
              label={panelID}
              name={`delivery.${id}.enabled`}
              id={`delivery.${id}.enabled`}
              checked={formik.values.delivery[id].enabled}
              onChange={handleChange}
            />
          );
        })}
      </div>
    );
  };
  const renderDiscount = () => {
    switch (formik.values.delivery.discount_choices[0]) {
      case 'every_day':
        return (
          <TextField
            type="number"
            value={formik.values.delivery.discount.monday}
            onChange={(e) => {
              const updatedDiscount = _.mapValues(formik.values.delivery.discount, (day) => {
                return typeof day === 'string' ? e : day;
              });
              formik.setFieldValue('delivery.discount', updatedDiscount);
            }}
            label="Discount amount"
          />
        );
      case 'specific_day':
        return (
          <FormLayout>
            {tabs.map(({ id, panelID }, index) => {
              return (
                <TextField
                  type="number"
                  key={id}
                  onChange={(e) => {
                    formik.setFieldValue(`delivery.discount.${id}`, e);
                  }}
                  value={formik.values.delivery.discount[id]}
                  label={`${panelID} - Discount amount`}
                />
              );
            })}
          </FormLayout>
        );
      default:
        return (
          <div style={{ marginTop: '20px' }}>
            <Button
              onClick={() => {
                setShowModalDiscount(true);
              }}
            >
              Add discount
            </Button>
            {formik.values.delivery.discount.specific_dates?.length > 0 && (
              <div style={{ marginTop: 10 }}>
                <ResourceList
                  selectable={false}
                  itemCount={formik.values.delivery.discount.specific_dates?.length}
                  items={formik.values.delivery.discount.specific_dates.sort(
                    (a, b) => new Date(a.date) - new Date(b.date)
                  )}
                  renderItem={(item, id) => {
                    return (
                      <ResourceItem id={id} name={item}>
                        <div style={{ padding: '10px 0' }}>
                          <LegacyStack distribution="equalSpacing">
                            <Text variant="headingMd">
                              {moment(item.date, 'YYYY-MM-DD').format('dddd, MMMM DD, YYYY')}{' '}
                              {item.amount && `- ${item.amount}%`}
                            </Text>
                            <Button
                              onClick={() => {
                                formik.setFieldValue(
                                  'delivery.discount.specific_dates',
                                  formik.values.delivery.discount.specific_dates.filter(
                                    (discount) => discount.date !== item.date
                                  )
                                );
                              }}
                              plain
                              monochrome
                            >
                              <Icon source={DeleteMajor} />
                            </Button>
                          </LegacyStack>
                        </div>
                      </ResourceItem>
                    );
                  }}
                />
              </div>
            )}
          </div>
        );
    }
  };
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
  const handleTabChange = (selectedTabIndex) => {
    setSelectedTab(selectedTabIndex);
  };
  const handleMonthChange = useCallback((month, year) => setDate({ month, year }), []);
  const onDateChange = () => {};
  const tabs = [
    {
      id: 'monday',
      content: 'Mon',
      accessibilityLabel: 'Monday',
      panelID: 'Monday',
    },
    {
      id: 'tuesday',
      content: 'Tue',
      accessibilityLabel: 'Tuesday',
      panelID: 'Tuesday',
    },
    {
      id: 'wednesday',
      content: 'Wed',
      accessibilityLabel: 'wednesday',
      panelID: 'Wednesday',
    },
    {
      id: 'thursday',
      content: 'Thu',
      accessibilityLabel: 'thursday',
      panelID: 'Thursday',
    },
    {
      id: 'friday',
      content: 'Fri',
      accessibilityLabel: 'friday',
      panelID: 'Friday',
    },
    {
      id: 'saturday',
      content: 'Sat',
      accessibilityLabel: 'saturday',
      panelID: 'Saturday',
    },
    {
      id: 'sunday',
      content: 'Sun',
      accessibilityLabel: 'Sun',
      panelID: 'Sunday',
    },
  ];
  const getDateInRange = (dateType, selectedDates, amount) => {
    const _values = { ...formik.values };
    const currentDate = new Date(selectedDates.start);
    while (currentDate <= new Date(selectedDates.end)) {
      const weekDay = moment(currentDate).get('isoWeekday');
      const date = moment(currentDate).format('YYYY-MM-DD');
      switch (weekDay) {
        case 1:
          _values.delivery.monday.enabled = true;
          break;
        case 2:
          _values.delivery.tuesday.enabled = true;
          break;
        case 3:
          _values.delivery.wednesday.enabled = true;
          break;
        case 4:
          _values.delivery.thursday.enabled = true;
          break;
        case 5:
          _values.delivery.friday.enabled = true;
          break;
        case 6:
          _values.delivery.saturday.enabled = true;
          break;
        case 7:
          _values.delivery.sunday.enabled = true;
          break;
        default:
          break;
      }
      currentDate.setDate(currentDate.getDate() + 1);
      if (dateType == 'discount') {
        _values.delivery[dateType].specific_dates.push({ date, amount });
      } else {
        _values.delivery[dateType].push(date);
      }
    }
    formik.setFieldValue({ ..._values });
  };
  const renderDeliverySlot = () => {
    if (formik.values.delivery.available_slot[0]) {
      return (
        <div style={{ marginTop: '30px' }}>
          <FormLayout>
            <p>Every day</p>
            {formik.values.delivery.every_day.time?.map((time, index) => {
              return (
                <div style={{display: "flex"}}>
                  <div style={{"flex": "1 1 auto"}}>
                    <Select
                      value={time}
                      options={timeOptions}
                      onChange={(e) => {
                        const updatedTime = [...formik.values.delivery.every_day.time];
                        updatedTime[index] = e;
                        formik.setFieldValue('delivery.every_day.time', updatedTime);
                      }}
                    />
                  </div>
                  <div style={{"margin-left": "var(--p-space-1)", "flex": "0 0 auto"}}>
                    <Button 
                      icon={MobileCancelMajor}
                      onClick={() => {
                        formik.setFieldValue('delivery.every_day.time', formik.values.delivery.every_day.time.filter(t => t != time));
                      }}
                    />
                  </div>
                </div>
              );
            })}
            <Button
              onClick={() => {
                formik.setFieldValue('delivery.every_day.time', [...formik.values.delivery.every_day.time, '9:00']);
              }}
            >
              Add slot
            </Button>
          </FormLayout>
        </div>
      );
    } else {
      return (
        <div style={{ marginTop: '30px' }}>
          <FormLayout>
            {Object.keys(formik.values.delivery).map((item, index) => {
              return formik.values.delivery[item].enabled === true ? (
                <div style={{ marginTop: '30px' }}>
                  <FormLayout>
                    <p style={{ textTransform: 'capitalize' }}>{item}</p>
                    {formik.values.delivery[item].time?.map((time, i) => {
                      return (
                        <div style={{display: "flex"}}>
                          <div style={{"flex": "1 1 auto"}}>
                            <Select
                              value={time}
                              options={timeOptions}
                              onChange={(e) => {
                                const updatedTime = [...formik.values.delivery[item].time];
                                updatedTime[i] = e;
                                formik.setFieldValue(`delivery.${item}.time`, updatedTime);
                              }}
                            />
                          </div>
                          <div style={{"margin-left": "var(--p-space-1)", "flex": "0 0 auto"}}>
                            <Button 
                              icon={MobileCancelMajor}
                              onClick={() => {
                                formik.setFieldValue(`delivery.${item}.time`, formik.values.delivery[item].time.filter(t => t != time));
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                    <Button
                      onClick={() => {
                        formik.setFieldValue(`delivery.${item}.time`, [...formik.values.delivery[item].time, '9:00']);
                      }}
                    >
                      Add slot
                    </Button>
                  </FormLayout>
                </div>
              ) : null;
            })}
          </FormLayout>
        </div>
      );
    }
  };
  const renderDeliveryDate = (title) => {
    return (
      <LegacyCard.Section title={title}>
        <Popover
          active={popoverActive}
          activator={
            <TextField
              value={dateValue}
              onChange={onDateChange}
              onFocus={() => setPopoverActive(true)}
              placeholder="Select a date ..."
              prefix={<Icon source={CalendarMajor} />}
              connectedRight={
                <Button
                  onClick={() => {
                    if (dateValue) {
                      getDateInRange('block_dates', selectedDates);
                      setPopoverActive(false);
                      setSelectedDates({
                        start: new Date('Wed Feb 07 2018 00:00:00 GMT-0500 (EST)'),
                        end: new Date('Sat Feb 10 2018 00:00:00 GMT-0500 (EST)'),
                      });
                      setDateValue('');
                    } else {
                      setPopoverActive(true);
                    }
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <Icon source={PlusMinor} />
                    <p>Add dates</p>
                  </div>
                </Button>
              }
            />
          }
          onClose={() => setPopoverActive(false)}
        >
          {renderDatePicker(selectedDates, setSelectedDates, setDateValue, setPopoverActive)}
        </Popover>
        {formik.values.delivery.block_dates.length > 0 && (
          <div style={{ marginTop: 10 }}>
            <ResourceList
              selectable={false}
              itemCount={formik.values.delivery.block_dates.length}
              items={formik.values.delivery.block_dates}
              renderItem={(item, id) => {
                return (
                  <ResourceItem id={id} name={item}>
                    <div style={{ padding: '10px 0' }}>
                      <LegacyStack distribution="equalSpacing">
                        <Text variant="headingMd">{moment(item, 'YYYY-MM-DD').format('dddd, MMMM DD, YYYY')}</Text>
                        <Button
                          onClick={() => {
                            formik.setFieldValue(
                              'delivery.block_dates',
                              formik.values.delivery.block_dates.filter((_, index) => index !== Number(id))
                            );
                          }}
                          plain
                          monochrome
                        >
                          <Icon source={DeleteMajor} />
                        </Button>
                      </LegacyStack>
                    </div>
                  </ResourceItem>
                );
              }}
            />
          </div>
        )}
      </LegacyCard.Section>
    );
  };

  const getProductSettings = async (productId) => {
    setLoading(true);
    const { data } = await authAxios.post(`/api/get_data`, { product_id: productId, shop });
    setLoading(false);
    if (data.data.settings) {
      formik.setFieldValue('delivery', data.data.settings);
    }
    if (data.data.product) {
      setProduct(data.data.product);
    }
  };

  useEffect(() => {
    getProductSettings(params.id);
  }, []);

  return (
    loading ? <div className="spinner"><Spinner size="large" /></div> : (
      <Page title={product.title} primaryAction={{ content: "Save", onAction: handleSubmit }} backAction={{ content: "Go back", url: "/" }}>
        <Layout>
          <Layout.Section>
            <LegacyCard>
              <LegacyCard.Section title="Availability">
                <ChoiceList
                  choices={[
                    { label: 'Every day of the week', value: 'every_day' },
                    { label: 'Specific days of the week', value: 'specific_day' },
                    { label: 'Specific dates of the year', value: 'specific_date' },
                  ]}
                  name="delivery.availability"
                  id="delivery.availability"
                  selected={formik.values.delivery.availability}
                  onChange={handleChange}
                />
                {formik.values.delivery.availability[0] === 'specific_day' && renderCheckbox()}
              </LegacyCard.Section>
              {formik.values.delivery.availability[0] === 'specific_date' && renderDeliveryDate('Available dates')}

              <LegacyCard.Section title="Available Slots">
                <ChoiceList
                  choices={[
                    { label: 'Same every day of the week', value: true },
                    { label: 'Different each day of the week', value: false },
                  ]}
                  name="delivery.available_slot"
                  id="delivery.available_slot"
                  selected={formik.values.delivery.available_slot}
                  onChange={handleChange}
                />
                {renderDeliverySlot()}
              </LegacyCard.Section>
              {!formik.values.delivery.reverse_block_dates && renderDeliveryDate('Block Dates')}
              <LegacyCard.Section title="Preparation times">
                <LegacyTabs tabs={tabs} selected={selectedTab} onSelect={handleTabChange} fitted>
                  <LegacyCard.Section>
                    <p style={{ marginBottom: 10 }}>
                      Preparation time required for orders place on {tabs[selectedTab].panelID}
                    </p>
                    <TextField
                      type="number"
                      value={formik.values.delivery.advanced_notice[tabs[selectedTab].id].value}
                      onChange={handleChange}
                      name={`delivery.advanced_notice.${tabs[selectedTab].id}.value`}
                      id={`delivery.advanced_notice.${tabs[selectedTab].id}.value`}
                      connectedRight={
                        <Select
                          name={`delivery.advanced_notice.${tabs[selectedTab].id}.format`}
                          id={`delivery.advanced_notice.${tabs[selectedTab].id}.format`}
                          value={formik.values.delivery.advanced_notice[tabs[selectedTab].id].format}
                          options={[
                            {
                              label: 'Minutes',
                              value: 'minutes',
                            },

                            {
                              label: 'Hours',
                              value: 'hours',
                            },
                            {
                              label: 'Days',
                              value: 'days',
                            },
                          ]}
                          onChange={handleChange}
                        >
                          123
                        </Select>
                      }
                    />
                  </LegacyCard.Section>
                </LegacyTabs>
              </LegacyCard.Section>
              <LegacyCard.Section title="Discounts">
                <FormLayout>
                  {/* <TextField type="number" value={formik.values.delivery.discount_amount} label="Discount amount" id="delivery.discount_amount" name="delivery.discount_amount" onChange={handleChange} /> */}
                  <ChoiceList
                    title="Discount type"
                    choices={[
                      { label: 'Every day of the week', value: 'every_day' },
                      { label: 'Specific days of the week', value: 'specific_day' },
                      { label: 'Specific dates of the year', value: 'specific_date' },
                    ]}
                    name="delivery.discount_choices"
                    id="delivery.discount_choices"
                    selected={formik.values.delivery.discount_choices}
                    onChange={handleChange}
                  />
                  {renderDiscount()}
                </FormLayout>
              </LegacyCard.Section>
            </LegacyCard>
          </Layout.Section>
          <Modal
            fullScreen
            onClose={() => {
              setShowModalDiscount(false);
              setDiscountDateValue('');
              setDiscountAmountValue('');
              setSelectedDiscountDates({
                start: new Date('Wed Feb 07 2018 00:00:00 GMT-0500 (EST)'),
                end: new Date('Sat Feb 10 2018 00:00:00 GMT-0500 (EST)'),
              });
            }}
            open={showModalDiscount}
            primaryAction={{
              content: 'Save',
              onAction: () => {
                // formik.setFieldValue('delivery.discount', [
                //   ...formik.values.delivery.discount,
                //   { date: discountDateValue, amount: discountValue.amount },
                // ]);
                if (discountDateValue) {
                  getDateInRange('discount', selectedDiscountDates, discountAmountValue);
                  setShowModalDiscount(false);
                  setSelectedDiscountDates({
                    start: new Date('Wed Feb 07 2018 00:00:00 GMT-0500 (EST)'),
                    end: new Date('Sat Feb 10 2018 00:00:00 GMT-0500 (EST)'),
                  });
                  setDiscountAmountValue('');
                  setDiscountDateValue('');
                } else {
                  setPopoverDiscountActive(true);
                }
                // setShowModalDiscount(false);
              },
            }}
            title="Add discount"
          >
            <LegacyCard>
              <LegacyCard.Section>
                <FormLayout>
                  <Popover
                    active={popoverDiscountActive}
                    activator={
                      <TextField
                        value={discountDateValue}
                        autoFocus={false}
                        onFocus={() => setPopoverDiscountActive(true)}
                        placeholder="Select date"
                        label="Select date"
                      />
                    }
                    onClose={() => setPopoverDiscountActive(false)}
                  >
                    {renderDatePicker(
                      selectedDiscountDates,
                      setSelectedDiscountDates,
                      setDiscountDateValue,
                      setPopoverDiscountActive
                    )}
                  </Popover>
                  <TextField
                    value={discountAmountValue}
                    onChange={(value) => {
                      setDiscountAmountValue(value);
                    }}
                    type="number"
                    label="Amount"
                  />
                </FormLayout>
              </LegacyCard.Section>
            </LegacyCard>
          </Modal>
        </Layout>
      </Page>
    )
  )
}