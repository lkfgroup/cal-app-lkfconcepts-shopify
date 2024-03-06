import {
  Button,
  DatePicker,
  EmptySearchResult,
  IndexFilters,
  IndexTable,
  Layout,
  LegacyCard,
  Page,
  Pagination,
  useIndexResourceState,
  useSetIndexFiltersMode,
  Modal,
  Popover,
  TextField,
  Select,
  LegacyStack,
  FormLayout,
} from '@shopify/polaris';
import { useFormik } from 'formik';
import * as _ from 'lodash';
import { useSearchParams } from 'react-router-dom';
import moment from 'moment';
import React, { useEffect, useState, useCallback, useMemo } from 'react';

export default function Order({ authAxios, shop }) {
  const [queryValue, setQueryValue] = useState('');
  const [pageInfo, setPageInfo] = useState();
  const [popoverActive, setPopoverActive] = useState(false);

  const [{ month, year }, setDate] = useState({ month: new Date().getMonth(), year: new Date().getFullYear() });
  const handleMonthChange = useCallback((month, year) => setDate({ month, year }), []);
  const [orderData, setOrderData] = useState();

  const [selected, setSelected] = useState(0);
  const { mode, setMode } = useSetIndexFiltersMode();
  const [isSearching, setIsSearching] = useState(false);
  const [orders, setOrders] = useState([]);
  const { selectedResources, allResourcesSelected, handleSelectionChange } = useIndexResourceState(orders);
  const [itemStrings, setItemStrings] = useState(['All']);
  const [showModal, setShowModal] = useState(false);
  const [dateValue, setDateValue] = useState('');
  const [selectedDates, setSelectedDates] = useState({
    start: new Date(),
    end: new Date(),
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingModal, setIsLoadingModal] = useState(false);
  const [settings, setSettings] = useState();
  const [searchParams, setSearchParams] = useSearchParams();
  const getOrder = async (id) => {
    try {
      let response = await authAxios.get(`/api/orders/${id}`);
      let order = response?.data?.data;
      if (order) {
        getProductSettings(parseId(order.lineItems.edges[0].node.product.id)).then(() => {
          setShowModal(true);
          setOrderData(order);
        });
      }
    } catch (error) {

    }
  }
  useEffect(() => {
    const id = searchParams.get('id');
    if (id) {
      getOrder(id);
    }
  }, [searchParams]);
  const formik = useFormik({
    initialValues: {
      area: 'HK_HK_R_LkfFumi',
      selected_date: '',
      selected_time: '',
      discount: '',
    },
  });
  const handleChange = (value, id) => {
    formik.handleChange({
      target: {
        id,
        value,
      },
    });
  };
  const areaOptions = [
    {
      value: 'HK_HK_R_LkfFumi',
      label: 'Fumi',
    },
    {
      value: 'HK_HK_R_LkfAriaItalian',
      label: 'Aria',
    },
    {
      value: 'HK_HK_R_LkfCiaoChow',
      label: 'BACI',
    },
    {
      value: 'HK_HK_R_LkfKyotojoe',
      label: 'Kyoto Joe',
    },
    {
      value: 'HK_HK_R_LkfPorterhouse',
      label: 'Porterhouse',
    },
    {
      value: 'HK_HK_R_LkfTokiojoe',
      label: 'Tokio Joe',
    },
  ];
  const fetch = useCallback(async (keySearch, after, before, limit) => {
    setIsSearching(true);
    const list = await authAxios.get(
      `/api/orders?keySearch=${keySearch || ''}&after=${after || ''}&before=${before || ''}&limit=${limit || 40}`
    );
    setIsSearching(false);
    setOrders(list.data.data);
    setPageInfo(list.data.pageInfo);
  }, []);
  useEffect(() => {
    fetch();
  }, [fetch]);
  const handleFiltersQueryChange = useCallback((value) => {
    setQueryValue(value);
    fetch(value, undefined, undefined);
  }, []);
  const onHandleCancel = () => {
    handleFiltersQueryChange('');
  };
  const tabs1 = itemStrings.map((item, index) => ({
    content: item,
    index,
    onAction: () => {},
    id: `${item}-${index}`,
    isLocked: index === 0,
    actions: null,
  }));
  const emptyStateMarkup = (
    <EmptySearchResult
      title={'No Orders yet'}
      description={'Try changing the filters or search term'}
      withIllustration
    />
  );
  const getProductSettings = async (productId) => {
    setIsLoadingModal(true);
    const { data } = await authAxios.post(`/api/get_data`, { product_id: productId, shop });
    setIsLoadingModal(false);
    setSettings(data.data.settings);
  };
  const resourceName = {
    singular: 'order',
    plural: 'orders',
  };
  const parseId = (id) => {
    return id.match(/\d+/)[0];
  };
  const handleSubmit = async () => {
    let areaLabel = '';
    for (let option of areaOptions) {
      if (option.value === formik.values.area) {
        areaLabel = option.label;
        break;
      }
    }
    setIsLoading(true);
    await authAxios.post('/api/fulfill_order', {
      ...formik.values,
      shop,
      order_id: parseId(orderData.id),
      area_label: areaLabel,
    });
    setIsLoading(false);
    setShowModal(false);
  };
  const rowMarkup = orders?.map(({ node }, index) => (
    <IndexTable.Row id={node.id} key={node.id} selected={selectedResources.includes(node.id)} position={index}>
      <IndexTable.Cell>{node.name}</IndexTable.Cell>
      <IndexTable.Cell>{moment(node.createdAt).format('MMMM D, h:mm a')}</IndexTable.Cell>

      <IndexTable.Cell>
        <Button
          size="slim"
          onClick={() => {
            getProductSettings(parseId(node.lineItems.edges[0].node.product.id));
            setOrderData(node);
            setShowModal(true);
          }}
        >
          Process
        </Button>
      </IndexTable.Cell>
    </IndexTable.Row>
  ));
  const discountValue = useMemo(() => {
    if (!settings) return '';
    if (settings.discount_choices[0] === 'specific_date') {
      for (let value of settings.discount.specific_dates) {
        if (value.date === moment(dateValue).format('YYYY-MM-DD')) {
          formik.setFieldValue('discount', `${value.amount} %`);
          return value.amount;
        }
      }
    }
  }, [settings, dateValue]);
  const timeOptions = useMemo(() => {
    let options = [];
    if (settings?.available_slot[0]) {
      options = settings?.every_day.time.map((time) => {
        return { label: time, value: time };
      });
    } else {
      options = settings?.[moment(dateValue).format('dddd').toLowerCase()]?.time.map((time) => {
        return { label: time, value: time };
      });
    }
    formik.setFieldValue('selected_time', options?.[0].value);
    return options;
  }, [settings, dateValue]);

  const disabledDates = useMemo(() => {
    let disabledDates = [];
    if (settings?.availability[0] === 'specific_day') {
      const days = moment(month + 1, 'MM').daysInMonth();
      for (let i = 1; i < Array(days).fill(0).length + 1; i++) {
        const weekday = moment({ year, month, day: i }).format('dddd').toLowerCase();
        if (settings && !settings[weekday].enabled) {
          disabledDates.push(new Date(moment({ year, month, day: i }).toISOString()));
        }
      }
    }
    if (!settings?.reverse_block_dates) {
      settings?.block_dates?.reduce((_disabledDates, date) => {
        const isoString = new Date(moment(date).toISOString());
        _disabledDates.push(isoString);
        return _disabledDates;
      }, disabledDates);
    }

    return disabledDates;
  }, [settings, year, month]);
  return (
    <Page title="Orders">
      <Layout>
        <Layout.Section>
          <Modal
            title={`Process ${orderData?.name}`}
            onClose={() => {
              setShowModal(false);
              setSettings(undefined);
              setDateValue('');
              setSelectedDates({
                start: new Date(),
                end: new Date(),
              });
              let params = searchParams.delete("id");
              setSearchParams(params);
              formik.resetForm();
            }}
            open={showModal}
            primaryAction={{
              content: 'Save',
              onAction: handleSubmit,
              loading: isLoading,
              disabled: isLoadingModal,
            }}
          >
            <LegacyCard>
              <LegacyCard.Section>
                {/* <LegacyCard.Section> */}
                <FormLayout>
                  <Select
                    label="Restaurant"
                    value={formik.values.area}
                    id="area"
                    name="area"
                    onChange={handleChange}
                    options={areaOptions}
                  />
                  <Popover
                    active={popoverActive}
                    activator={
                      <TextField
                        value={dateValue}
                        onFocus={() => setPopoverActive(true)}
                        placeholder="Select date"
                        label="Select date"
                      />
                    }
                    onClose={() => {
                      setPopoverActive(false);
                    }}
                  >
                    <LegacyCard.Section>
                      <DatePicker
                        month={month}
                        onChange={(e) => {
                          setDateValue(moment(e.start).format('dddd, MMMM DD, YYYY'));
                          setSelectedDates(e);
                          formik.setFieldValue('selected_date', moment(e.start).format('YYYY-MM-DD'));
                          setPopoverActive(false);
                        }}
                        selected={selectedDates}
                        year={year}
                        onMonthChange={handleMonthChange}
                        disableDatesAfter={
                          settings?.reverse_block_dates &&
                          settings?.block_dates.length > 0 &&
                          settings?.availability[0] === 'specific_date'
                            ? new Date(moment(settings.block_dates[settings.block_dates.length - 1]).toISOString())
                            : undefined
                        }
                        disableDatesBefore={
                          settings?.reverse_block_dates && settings?.block_dates.length > 0
                            ? new Date(moment(settings.block_dates[0]).toISOString())
                            : undefined
                        }
                        disableSpecificDates={disabledDates}
                      />
                    </LegacyCard.Section>
                  </Popover>
                  <Select
                    onChange={handleChange}
                    value={formik.values.selected_time}
                    id="selected_time"
                    name="selected_time"
                    label="Select time"
                    options={timeOptions}
                  />
                  <TextField
                    value={formik.values.discount}
                    id="discount"
                    name="discount"
                    onChange={handleChange}
                    label="Discount"
                  />
                </FormLayout>
              </LegacyCard.Section>
            </LegacyCard>
          </Modal>
          <LegacyCard>
            <IndexFilters
              queryValue={queryValue}
              queryPlaceholder="Searching in all"
              onQueryChange={handleFiltersQueryChange}
              onQueryClear={onHandleCancel}
              cancelAction={{
                onAction: onHandleCancel,
                disabled: false,
                loading: false,
              }}
              tabs={tabs1}
              selected={selected}
              onSelect={setSelected}
              canCreateNewView={false}
              filters={[]}
              mode={mode}
              setMode={setMode}
              loading={isSearching}
            />

            <IndexTable
              selectable={false}
              emptyState={emptyStateMarkup}
              resourceName={resourceName}
              itemCount={orders.length}
              selectedItemsCount={allResourcesSelected ? 'All' : selectedResources.length}
              onSelectionChange={handleSelectionChange}
              headings={[{ title: 'Order' }, { title: 'Date' }]}
            >
              {rowMarkup}
            </IndexTable>
          </LegacyCard>
        </Layout.Section>
      </Layout>
      <div style={{ width: 'fit-content', margin: '10px auto 0' }}>
        <Pagination
          label={`Page`}
          hasPrevious={pageInfo?.hasPreviousPage}
          onPrevious={() => {
            fetch(undefined, undefined, pageInfo.startCursor);
          }}
          hasNext={pageInfo?.hasNextPage}
          onNext={() => {
            fetch(undefined, pageInfo.endCursor, undefined);
          }}
        />
      </div>
    </Page>
  );
}
