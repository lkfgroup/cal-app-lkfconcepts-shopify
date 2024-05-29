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
        sync: ["weeloy"],
        sync_config: {
          weeloy: {
            base_url: "https://staging.weeloy.com",
            x_api_key: "SItaqBFZJDagTBeQIgQqF2Eqml1pRD7234LpgBfW",
            credential: "6LAWpA4CFDGKCqaA_8MKHFKA2wY_smquvqOw_Tj",
            source: "LKF-SHOPIFY",
            restaurant_id: ""
          },
          bistrochat: {
            base_url: "",
            venueId: "",
            bookingChannel: {
              id: "",
              name: ""
            }
          },
          eats365: {
            base_url: "",
            api_key: "",
            restaurant_code: ""
          }
        }
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
                <ChoiceList
                  choices={[
                    { label: "Weeloy", value: "weeloy", renderChildren: () => {
                      return formik.values.delivery.sync.includes("weeloy") && (
                        <FormLayout>
                          <TextField label="Base URL" id="delivery.sync_config.weeloy.base_url" name="delivery.sync_config.weeloy.base_url" onChange={handleChange} value={formik.values.delivery.sync_config.weeloy.base_url} />
                          <TextField label="API Key" id="delivery.sync_config.weeloy.x_api_key" name="delivery.sync_config.weeloy.x_api_key" onChange={handleChange} value={formik.values.delivery.sync_config.weeloy.x_api_key} />
                          <TextField label="Credential" id="delivery.sync_config.weeloy.credential" name="delivery.sync_config.weeloy.credential" onChange={handleChange} value={formik.values.delivery.sync_config.weeloy.credential} />
                          <TextField label="Source" id="delivery.sync_config.weeloy.source" name="delivery.sync_config.weeloy.source" onChange={handleChange} value={formik.values.delivery.sync_config.weeloy.source} />
                          <TextField label="Restaurant ID" id="delivery.sync_config.weeloy.restaurant_id" name="delivery.sync_config.weeloy.restaurant_id" onChange={handleChange} value={formik.values.delivery.sync_config.weeloy.restaurant_id} />
                        </FormLayout>
                      )
                    } },
                    { label: "Bistrochat", value: "bistrochat", renderChildren: () => {
                      return formik.values.delivery.sync.includes("bistrochat") && (
                        <FormLayout>
                          <TextField label="Base URL" id="delivery.sync_config.bistrochat.base_url" name="delivery.sync_config.bistrochat.base_url" onChange={handleChange} value={formik.values.delivery.sync_config.bistrochat.base_url} />
                          <TextField label="Venue ID" id="delivery.sync_config.bistrochat.venueId" name="delivery.sync_config.bistrochat.x_api_key" onChange={handleChange} value={formik.values.delivery.sync_config.bistrochat.venueId} />
                          <TextField label="Booking channel ID" id="delivery.sync_config.bistrochat.bookingChannel.id" name="delivery.sync_config.bistrochat.bookingChannel.id" onChange={handleChange} value={formik.values.delivery.sync_config.bistrochat.bookingChannel.id} />
                          <TextField label="Booking channel name" id="delivery.sync_config.bistrochat.bookingChannel.name" name="delivery.sync_config.bistrochat.bookingChannel.name" onChange={handleChange} value={formik.values.delivery.sync_config.bistrochat.bookingChannel.name} />
                        </FormLayout>
                      )
                    } },
                    { label: "Eats365", value: "eats365", renderChildren: () => {
                      return formik.values.delivery.sync.includes("eats365") && (
                        <FormLayout>
                          <TextField label="Base URL" id="delivery.sync_config.eats365.base_url" name="delivery.sync_config.eats365.base_url" onChange={handleChange} value={formik.values.delivery.sync_config.eats365.base_url} />
                          <TextField label="API Key" id="delivery.sync_config.eats365.api_key" name="delivery.sync_config.eats365.api_key" onChange={handleChange} value={formik.values.delivery.sync_config.eats365.api_key} />
                          <TextField label="Credential" id="delivery.sync_config.eats365.restaurant_code" name="delivery.sync_config.eats365.restaurant_code" onChange={handleChange} value={formik.values.delivery.sync_config.eats365.restaurant_code} />
                        </FormLayout>
                      )
                    } }
                  ]}
                  name="delivery.sync"
                  id="delivery.sync"
                  selected={formik.values.delivery.sync}
                  onChange={handleChange}
                />
              </LegacyCard.Section>
            </LegacyCard>
          </Layout.AnnotatedSection>
          <BlockDateModal open={openBlockDateModal} setOpen={setOpenBlockDateModal} formik={formik} />
        </Layout>
      </Page>
    )
  )
}