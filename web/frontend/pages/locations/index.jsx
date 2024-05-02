import { Button, IndexTable, Layout, LegacyCard, Page } from "@shopify/polaris";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

export default function Locations({ shop, authAxios }) {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true)
  const [locations, setLocations] = useState([]);

  const getLocations = async () => {
    setLoading(true);
    let response = await authAxios.post("/api/get-locations");
    if (response?.data?.success) {
      setLocations(response?.data?.data);
    }
    setLoading(false);
  }

  useEffect(() => {
    getLocations();
  }, []);

  const rowMarkup = locations?.map((location, index) => (
    <IndexTable.Row id={location._id} key={location._id} position={index}>
      <IndexTable.Cell>{location?.settings?.vendor}</IndexTable.Cell>
      <IndexTable.Cell>
        <Button
          size="slim"
          onClick={() => {
            navigate(`/locations/${location._id}`)
          }}
        >
          Configure
        </Button>
      </IndexTable.Cell>
    </IndexTable.Row>
  ));

  return (
    <Page title="Locations" primaryAction={{ content: "Add location", url: "/locations/new" }}>
      <Layout>
        <Layout.Section>
          <LegacyCard>
            <IndexTable
              loading={loading}
              selectable={false}
              resourceName={{ singular: "location", plural: "locations" }}
              itemCount={locations.length}
              headings={[{ title: 'Name' }, { title: 'Action' }]}
            >
              {rowMarkup}
            </IndexTable>
          </LegacyCard>
        </Layout.Section>
      </Layout>
    </Page>
  )
}