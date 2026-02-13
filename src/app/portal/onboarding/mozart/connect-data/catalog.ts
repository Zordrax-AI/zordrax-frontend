export type CatalogItem = {
  id: string;
  name: string;
  type: string;
  logoSlug: string;
  popular?: boolean;
};

export const catalog: CatalogItem[] = [
  { id: "google_sheets", name: "Google Sheets", type: "google_sheets", logoSlug: "google_sheets", popular: true },
  { id: "ga4", name: "Google Analytics 4", type: "google_analytics_4", logoSlug: "ga4", popular: true },
  { id: "hubspot", name: "HubSpot", type: "hubspot", logoSlug: "hubspot", popular: true },
  { id: "stripe", name: "Stripe", type: "stripe", logoSlug: "stripe", popular: true },
  { id: "salesforce", name: "Salesforce", type: "salesforce", logoSlug: "salesforce", popular: true },
  { id: "shopify", name: "Shopify", type: "shopify", logoSlug: "shopify", popular: true },
  { id: "postgres", name: "Postgres", type: "postgres", logoSlug: "postgres" },
  { id: "azure_sql", name: "Azure SQL", type: "azure_sql", logoSlug: "azure_sql" },
  { id: "mysql", name: "MySQL", type: "mysql", logoSlug: "mysql" },
  { id: "bigquery", name: "BigQuery", type: "bigquery", logoSlug: "bigquery" },
  { id: "redshift", name: "Redshift", type: "redshift", logoSlug: "redshift" },
  { id: "snowflake", name: "Snowflake", type: "snowflake", logoSlug: "snowflake" },
  { id: "databricks", name: "Databricks", type: "databricks", logoSlug: "databricks" },
  { id: "dynamodb", name: "DynamoDB", type: "dynamodb", logoSlug: "dynamodb" },
  { id: "s3", name: "Amazon S3", type: "s3", logoSlug: "s3" },
  { id: "gcs", name: "Google Cloud Storage", type: "gcs", logoSlug: "gcs" },
  { id: "mssql", name: "SQL Server", type: "mssql", logoSlug: "mssql" },
  { id: "oracle", name: "Oracle", type: "oracle", logoSlug: "oracle" },
  { id: "mongo", name: "MongoDB", type: "mongodb", logoSlug: "mongodb" },
  { id: "athena", name: "Athena", type: "athena", logoSlug: "athena" },
  { id: "airtable", name: "Airtable", type: "airtable", logoSlug: "airtable" },
  { id: "zendesk", name: "Zendesk", type: "zendesk", logoSlug: "zendesk" },
  { id: "jira", name: "Jira", type: "jira", logoSlug: "jira" },
  { id: "asana", name: "Asana", type: "asana", logoSlug: "asana" },
  { id: "notion", name: "Notion", type: "notion", logoSlug: "notion" },
  { id: "clickhouse", name: "ClickHouse", type: "clickhouse", logoSlug: "clickhouse" },
  { id: "elastic", name: "Elasticsearch", type: "elasticsearch", logoSlug: "elasticsearch" },
  { id: "cassandra", name: "Cassandra", type: "cassandra", logoSlug: "cassandra" },
  { id: "timescale", name: "TimescaleDB", type: "timescale", logoSlug: "timescale" },
  { id: "influx", name: "InfluxDB", type: "influxdb", logoSlug: "influxdb" },
  { id: "snowplow", name: "Snowplow", type: "snowplow", logoSlug: "snowplow" },
  { id: "segment", name: "Segment", type: "segment", logoSlug: "segment" },
  { id: "pipedrive", name: "Pipedrive", type: "pipedrive", logoSlug: "pipedrive" },
  { id: "marketo", name: "Marketo", type: "marketo", logoSlug: "marketo" },
];
