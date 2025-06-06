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
import '../assets/style.scss';
import { useFormik } from 'formik';
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';

export default function Index({ shop, authAxios }) {
  const [pageInfo, setPageInfo] = useState();
  const [products, setProducts] = useState([]);

  const navigate = useNavigate();

  const formik = useFormik({
    initialValues: {
      keySearch: "",
      after: "",
      before: "",
      limit: 100,
      product_type: [],
      vendor: [],
      status: ""
    }
  });

  const handleChange = (value, id) => {
    formik.handleChange({
      target: {
        id,
        value,
      },
    });
  };

  useEffect(()=>{
    setTimeout(() => {
      fetch()
    }, 300);
  }, [formik.values])

  const handleNext = async (after) => {
    await fetch({ before: "", after });
  }

  const handlePrevious = async (before) => {
    await fetch({ before, after: "" });
  }

  const [savedSearches, setSavedSearches] = useState([]);

  const fetch = async (data = {}, fetchSavedSearches = false) => {
    setIsSearching(true);
    const list = await authAxios.post("/api/products", {...formik.values, ...data});
    if (fetchSavedSearches) {
      const searches = await authAxios.post("/api/save_search");
      setSavedSearches(searches?.data?.saved_searches);
      let newItemStrings = searches?.data?.saved_searches?.map((s) => {
        return s.name
      });
      newItemStrings = ["All"].concat(newItemStrings)
      setItemStrings(newItemStrings);
    }
    setIsSearching(false);
    setProducts(list.data.data);
    setPageInfo(list.data.pageInfo);
  };

  useEffect(() => {
    fetch({}, true);
  }, []);

  const resourceName = {
    singular: 'product',
    plural: 'products',
  };
  
  const parseId = (id) => {
    return id.match(/\d+/)[0];
  };

  const { selectedResources, allResourcesSelected, handleSelectionChange } = useIndexResourceState(products);

  const findSku = (tags = []) => {
    let tag = tags.find((tag) => tag.includes("SKU:"));
    return tag ? tag?.replace("SKU:", "") : "";
  }

  const rowMarkup = products?.map(({ node }, index) => (
    <IndexTable.Row id={node.id} key={node.id} selected={selectedResources.includes(node.id)} position={index}>
      <IndexTable.Cell>{node.title}</IndexTable.Cell>
      <IndexTable.Cell>
        <Button
          size="slim"
          onClick={(e) => {
            let sku = findSku(node.tags);            
	    if( e.button === 1){
	       const currentUrl = new URL(window.location.href);
               const searchParams = new URLSearchParams(currentUrl.search);
	       window.open(`/products/${sku ? sku : parseId(node.id)}?${searchParams.toString()}`, '_blank');
	    } else {
	       navigate(`/products/${sku ? sku : parseId(node.id)}`)
	    }
          }}
        >
          Configure
        </Button>
      </IndexTable.Cell>
    </IndexTable.Row>
  ));
  
  const onHandleCancel = () => {
    handleFiltersQueryChange('');
  };

  const [itemStrings, setItemStrings] = useState(['All']);
  const [selected, setSelected] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [keySearch, setKeySearch] = useState("");

  const handleFiltersQueryChange = (value) => {
    setKeySearch(value);
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      handleChange(keySearch, "keySearch")
    }, 1000)

    return () => clearTimeout(delayDebounceFn)
  }, [keySearch])

  const emptyStateMarkup = (
    <EmptySearchResult
      title={'No products yet'}
      description={'Try changing the filters or search term'}
      withIllustration
    />
  );

  const { mode, setMode } = useSetIndexFiltersMode();

  const renameView = async (name, index) => {
    const newItemsStrings = tabs.map((item, idx) => {
      if (idx === index) {
        return name;
      }
      return item.content;
    });
    const search = savedSearches[index - 1];
    await updateSearch(search?._id, "UPDATE", name, search?.filters);
    setItemStrings(newItemsStrings);
  }

  const deleteView = async (index) => {
    const search = savedSearches[index - 1];
    await updateSearch(search?._id, "DELETE", "", {});
    const newItemStrings = [...itemStrings];
    newItemStrings.splice(index, 1);
    setItemStrings(newItemStrings);
    setSelected(0);
  };

  const duplicateView = async (name, index) => {
    const search = savedSearches[index - 1];
    const response = await updateSearch("", "CREATE", name, search?.filters);
    const newSearch = response?.data?.result;
    setSavedSearches([...savedSearches, newSearch])
    setItemStrings([...itemStrings, name]);
    setSelected(itemStrings.length);
    await sleep(1);
    return true;
  };
  
  const tabs = itemStrings.map((item, index) => ({
    content: item,
    index,
    onAction: () => {},
    id: `${item}-${index}`,
    isLocked: index === 0,
    actions: index === 0 ? [] : [
      {
        type: 'rename',
        onAction: () => {},
        onPrimaryAction: async (value) => {
          await renameView(value, index);
          return true;
        },
      },
      {
        type: 'duplicate',
        onPrimaryAction: async (value) => {
          await duplicateView(value, index);
          return true;
        },
      },
      {
        type: 'delete',
        onPrimaryAction: async () => {
          await deleteView(index);
          return true;
        },
      },
    ]
  }));

  const filters = [
    {
      key: "vendor",
      label: "Product vendor",
      filter: (
        <ChoiceList
          title="Product vendor"
          titleHidden
          choices={[
            { label: "Aria", value: "Aria" },
            { label: "BACI", value: "BACI" },
            { label: "FUMI", value: "FUMI" },
            { label: "Kyoto Joe", value: "Kyoto Joe" },
            { label: "LKF Cellar", value: "LKF Cellar" },
            { label: "LKF Concepts", value: "LKF Concepts" },
            { label: "LKF Elite", value: "LKF Elite" },
            { label: "Porterhouse", value: "Porterhouse" },
            { label: "Tokio Joe", value: "Tokio Joe" },
          ]}
          name="vendor"
          id="vendor"
          selected={formik.values.vendor}
          onChange={handleChange}
          allowMultiple
        />
      )
    },
    {
      key: "product_type",
      label: "Product type",
      filter: (
        <ChoiceList
          title="Product type"
          titleHidden
          choices={[
            { label: "Alcohol Pairing", value: "Alcohol Pairing" },
            { label: "Brunch", value: "Brunch" },
            { label: "Delivery/Takeaway", value: "Delivery/Takeaway" },
            { label: "Experience", value: "Experience" },
            { label: "Gift Card", value: "Gift Card" },
            { label: "Menu", value: "Menu" },
            { label: "Past Experience", value: "Past Experience" },
            { label: "Private Room Booking", value: "Private Room Booking" },
            { label: "SHOPSTORM_HIDDEN_PRODUCT", value: "SHOPSTORM_HIDDEN_PRODUCT" },
            { label: "Voucher", value: "Voucher" },
            { label: "e-Gift Card", value: "e-Gift Card" },
          ]}
          name="product_type"
          id="product_type"
          selected={formik.values.product_type}
          onChange={handleChange}
          allowMultiple
        />
      )
    },
    {
      key: "status",
      label: "Status",
      filter: (
        <ChoiceList
          title="Status"
          titleHidden
          choices={[
            { label: "Active", value: "ACTIVE" },
            { label: "Draft", value: "DRAFT" },
            { label: "Archived", value: "ARCHIVED" },
          ]}
          name="status"
          id="status"
          selected={[formik.values.status]}
          onChange={(value) => handleChange(value[0], "status")}
        />
      )
    }
  ];

  const updateSearch = async (_id, action, name, filters) => {
    return await authAxios.post("/api/update_save_search", {
      _id, action, name, filters
    })
  }

  const onHandleSave = async (value) => {
    await updateSearch("", "UPDATE", value, formik.values);
    return true;
  };
  
  const onCreateNewView = async (value) => {
    let response = await updateSearch("", "CREATE", value, formik.values);
    let newSearch = response?.data?.result;
    setSavedSearches([...savedSearches, newSearch])
    setItemStrings([...itemStrings, value]);
    setSelected(itemStrings.length);
    return true;
  };

  const onSelect = async (index) => {
    if (index > 0) {
      let filters = savedSearches[index - 1].filters;
      formik.setValues(filters)
    } else {
      formik.resetForm();
    }
    setSelected(index);
    return true;
  }

  return (
    <Page title="Products">
      <Layout>
        <Layout.Section>
          <LegacyCard>
            <IndexFilters
              queryValue={keySearch}
              queryPlaceholder="Searching in all"
              onQueryChange={handleFiltersQueryChange}
              onQueryClear={onHandleCancel}
              cancelAction={{
                onAction: onHandleCancel,
                disabled: false,
                loading: false,
              }}
              tabs={tabs}
              selected={selected}
              onSelect={onSelect}
              canCreateNewView={false}
              filters={filters}
              mode={mode}
              setMode={setMode}
              loading={isSearching}
              primaryAction={selected === 0 ? {
                type: 'save-as',
                onAction: onCreateNewView,
                disabled: false,
                loading: false,
              } : {
                type: 'save',
                onAction: onHandleSave,
                disabled: false,
                loading: false,
              }}
            />

            <IndexTable
              selectable={false}
              emptyState={emptyStateMarkup}
              resourceName={resourceName}
              itemCount={products.length}
              selectedItemsCount={allResourcesSelected ? 'All' : selectedResources.length}
              onSelectionChange={handleSelectionChange}
              headings={[{ title: 'Name' }, { title: 'Action' }]}
            >
              {rowMarkup}
            </IndexTable>
          </LegacyCard>
        </Layout.Section>
      </Layout>
      <div style={{ width: 'fit-content', margin: '10px auto 0' }}>
        <Pagination
          hasPrevious={pageInfo?.hasPreviousPage}
          onPrevious={() => {
            handlePrevious(pageInfo.startCursor);
          }}
          hasNext={pageInfo?.hasNextPage}
          onNext={() => {
            handleNext(pageInfo.endCursor);
          }}
        />
      </div>
    </Page>
  );
}
