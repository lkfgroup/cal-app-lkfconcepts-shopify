import { Button, Checkbox, ChoiceList, FormLayout, Grid, Icon, Layout, LegacyCard, LegacyStack, Page, ResourceItem, ResourceList, Select, VerticalStack, Text, TextField, Spinner } from "@shopify/polaris";
import { useFormik } from "formik";
import { timeOptions } from "../../../timeOptions";
import { CalendarMajor, PlusMinor, DeleteMajor, MobileCancelMajor } from '@shopify/polaris-icons';
import _ from "lodash";
import BlockDateModal from "../../../components/BlockDateModal";
import { useEffect, useState } from "react";
import moment from "moment";
import { useNavigate, useParams } from "react-router";

export default function Location({ shop, authAxios }) {
  const params = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [openBlockDateModal, setOpenBlockDateModal] = useState(false);

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
          exclude_dates: [],
          rolling_days: [
            { days: 0, amount: 0}
          ]
        },
        discount_amount: 0,
        discount_choices: [],
        block_dates: [],
        reverse_block_dates: false,
        available_slot: [true],
        available_slot_specific_dates_allowed: false,
        available_slot_specific_dates: [],
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
          time: [
            { start: "9:00", end: "17:00" }
          ],
        },
        monday: {
          enabled: true,
          time: [ { start: "9:00", end: "17:00" } ],
        },
        tuesday: {
          enabled: true,
          time: [ { start: "9:00", end: "17:00" } ],
        },
        wednesday: {
          enabled: true,
          time: [ { start: "9:00", end: "17:00" } ],
        },
        thursday: {
          enabled: true,
          time: [ { start: "9:00", end: "17:00" } ],
        },
        friday: {
          enabled: true,
          time: [ { start: "9:00", end: "17:00" } ],
        },
        saturday: {
          enabled: true,
          time: [ { start: "9:00", end: "17:00" } ],
        },
        sunday: {
          enabled: true,
          time: [ { start: "9:00", end: "17:00" } ],
        },
      },
      vendor: ""
    },
  });

  const handleSubmit = async () => {
    setLoading(true);
    let response = await authAxios.post('/api/edit-location', { id: params?.id ? params?.id : "new", settings: formik.values });
    if (response?.data?.success) {
      let id = response?.data?.data?._id;
      if (id && id != params.id) {
        navigate(`/locations/${id}`);
      }
    }
    setLoading(false);
  };

  const getSettings = async (id) => {
    setLoading(true);
    const { data } = await authAxios.post(`/api/get-location`, { id });
    setLoading(false);
    if (data.data.settings) {
      formik.setValues(_.merge(formik.initialValues, data.data.settings));
    }
  };

  useEffect(() => {
    if (params?.id == "new") {
      setLoading(false);
    } else {
      getSettings(params.id);
    }
  }, []);

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
    formik.handleChange({
      target: {
        id,
        value,
      },
    });
  };

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

  const renderCheckbox = () => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
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

  const renderDeliverySlot = () => {
    if (formik.values.delivery.available_slot[0]) {
      return (
        <LegacyCard.Section title="Every day">
          <VerticalStack gap="2">
            {formik.values.delivery.every_day.time?.map(({ start, end }, index) => {
              return (
                <div style={{ display: "flex", padding: "var(--p-space-1) 0" }}>
                  <div style={{"flex": "1 1 auto"}}>
                    <div style={{ display: "flex", gap: "var(--p-space-1)" }}>
                      <div style={{ width: "100%" }}>
                        <div style={{ marginBottom: "var(--p-space-1)" }}>Start time</div>
                        <Select
                          value={start}
                          options={timeOptions}
                          onChange={(e) => {
                            let updatedTime = formik.values.delivery.every_day.time;
                            updatedTime[index]["start"] = e;
                            formik.setFieldValue('delivery.every_day.time', updatedTime);
                          }}
                        />
                      </div>
                      <div style={{ width: "100%" }}>
                        <div style={{ marginBottom: "var(--p-space-1)" }}>End time</div>
                        <Select
                          value={end}
                          options={timeOptions}
                          onChange={(e) => {
                            let updatedTime = formik.values.delivery.every_day.time;
                            updatedTime[index]["end"] = e;
                            formik.setFieldValue('delivery.every_day.time', updatedTime);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  <div style={{"margin-left": "var(--p-space-1)", "flex": "0 0 auto", display: "flex", alignItems: "flex-end" }}>
                    <Button 
                      icon={MobileCancelMajor}
                      onClick={() => {
                        formik.setFieldValue('delivery.every_day.time', formik.values.delivery.every_day.time.filter(t => t.start != start && t.end != end));
                      }}
                    />
                  </div>
                </div>
              );
            })}
            <div style={{ padding: "var(--p-space-1) 0" }}>
              <Button
                onClick={() => {
                  formik.setFieldValue('delivery.every_day.time', [...formik.values.delivery.every_day.time, { start: "9:00", end: "17:00" }]);
                }}
              >
                Add slot
              </Button>
            </div>
          </VerticalStack>
        </LegacyCard.Section>
      );
    } else {
      return Object.keys(formik.values.delivery).map((item, index) => {
        return formik.values.delivery[item].enabled === true ? (
          <LegacyCard.Section title={_.capitalize(item)}>
            <VerticalStack gap="2">
              {formik.values.delivery[item].time?.map(({ start, end }, index) => {
                return (
                  <div style={{display: "flex", padding: "var(--p-space-1) 0"}}>
                    <div style={{"flex": "1 1 auto"}}>
                      <div style={{ display: "flex", gap: "var(--p-space-1)" }}>
                        <div style={{ width: "100%" }}>
                          <div style={{ marginBottom: "var(--p-space-1)" }}>Start time</div>
                          <Select
                            value={start}
                            options={timeOptions}
                            onChange={(e) => {
                              let updatedTime = formik.values.delivery[item].time;
                              updatedTime[index]["start"] = e;
                              formik.setFieldValue(`delivery.${item}.time`, updatedTime);
                            }}
                          />
                        </div>
                        <div style={{ width: "100%" }}>
                          <div style={{ marginBottom: "var(--p-space-1)" }}>End time</div>
                          <Select
                            value={end}
                            options={timeOptions}
                            onChange={(e) => {
                              let updatedTime = formik.values.delivery[item].time;
                              updatedTime[index]["end"] = e;
                              formik.setFieldValue(`delivery.${item}.time`, updatedTime);
                            }}
                          />
                        </div>
                      </div>
                    </div>
                    <div style={{"margin-left": "var(--p-space-1)", "flex": "0 0 auto", display: "flex", alignItems: "flex-end"}}>
                      <Button 
                        icon={MobileCancelMajor}
                        onClick={() => {
                          formik.setFieldValue(`delivery.${item}.time`, formik.values.delivery[item].time.filter(t => t.start != start && t.end != end));
                        }}
                      />
                    </div>
                  </div>
                );
              })}
              <div style={{ padding: "var(--p-space-1) 0" }}>
                <Button
                  onClick={() => {
                    formik.setFieldValue(`delivery.${item}.time`, [...formik.values.delivery[item].time, { start: "9:00", end: "17:00" }]);
                  }}
                >
                  Add slot
                </Button>
              </div>
            </VerticalStack>
          </LegacyCard.Section>
        ) : null;
      })
    }
  };

  return (
    loading ? <div className="spinner"><Spinner size="large" /></div> : (
      <Page title={formik?.values?.vendor ? formik?.values?.vendor : "Location"} primaryAction={{ content: "Save", onAction: handleSubmit }} backAction={{ url: "/locations", content: "Go back" }}>
        <Layout>
          <Layout.AnnotatedSection title="Operation Hours" description="Set the Operation Hours for this specific location">
            <LegacyCard>
              <LegacyCard.Section title="Days">
                {renderCheckbox()}
              </LegacyCard.Section>
              <LegacyCard.Section title="Times">
                <FormLayout>
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
                </FormLayout>
              </LegacyCard.Section>
              {renderDeliverySlot()}
            </LegacyCard>
          </Layout.AnnotatedSection>
          <Layout.AnnotatedSection title="Block dates" description="">
            <LegacyCard>
              <LegacyCard.Section>
                <FormLayout>
                  <Button onClick={() => setOpenBlockDateModal(true)}>Add dates</Button>
                  <ResourceList
                    selectable={false}
                    itemCount={formik.values.delivery.block_dates?.length}
                    items={formik.values.delivery.block_dates.sort(
                      (a, b) => new Date(a.date) - new Date(b.date)
                    )}
                    renderItem={(item, id) => {
                      let times = item.times.map((t) => {
                        let time = timeOptions.find((o) => o.value == t);
                        return time.label;
                      })
                      return (
                        <ResourceItem id={id} name={item}>
                          <LegacyStack distribution="equalSpacing">
                            <Text>
                              {moment(item.date, 'YYYY-MM-DD').format('dddd, MMMM DD, YYYY')}{' - '}{times?.length > 0 ? times.join(", ") : "Entire day"}
                            </Text>
                            <Button
                              size="slim"
                              onClick={() => {
                                formik.setFieldValue(
                                  'delivery.block_dates',
                                  formik.values.delivery.block_dates.filter(
                                    (v) => v.date !== item.date
                                  )
                                );
                              }}
                              plain
                              monochrome
                            >
                              <Icon source={DeleteMajor} />
                            </Button>
                          </LegacyStack>
                        </ResourceItem>
                      );
                    }}
                  />
                </FormLayout>
              </LegacyCard.Section>
            </LegacyCard>
          </Layout.AnnotatedSection>
          <Layout.AnnotatedSection title="Vendor">
            <LegacyCard>
              <LegacyCard.Section>
                <TextField id="vendor" name="vendor" onChange={handleChange} value={formik.values.vendor} />
              </LegacyCard.Section>
            </LegacyCard>
          </Layout.AnnotatedSection>
          <Layout.AnnotatedSection title="Reservation System Sync">
            <LegacyCard>
              <LegacyCard.Section>

              </LegacyCard.Section>
            </LegacyCard>
          </Layout.AnnotatedSection>
          <BlockDateModal open={openBlockDateModal} setOpen={setOpenBlockDateModal} formik={formik} />
        </Layout>
      </Page>
    )
  )
}