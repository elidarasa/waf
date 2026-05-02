import { Table, Tag, Typography, Space, Button } from "antd";
import { FilterOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";

import { fmtDateTime } from "../../utils/format";

// Each row is a free-form JSON object (NDJSON line from VictoriaLogs). We
// type the well-known shape but tolerate extra fields in the expand row.
export interface LogRow {
  _time?: string;
  _msg?: string;
  event_type?: string;
  rule_name?: string;
  rule_id?: string | null;
  client_ip?: string;
  host?: string;
  method?: string;
  path?: string;
  tier?: string;
  detail?: string;
  req_id?: string;
  // Used by AntD as the row key — derived in the page so this is just
  // a passthrough field carried forwards from the unique tuple
  // (timestamp + req_id) when present.
  __rowKey?: string;
  // Tracing-stream rows include `level`, `target`, `stream`, etc. Expand
  // row simply pretty-prints the whole object so they're still readable.
  [extra: string]: unknown;
}

const eventTypeColor = (eventType: string | undefined): string => {
  switch (eventType) {
    case "block":
      return "red";
    case "rate_limit":
      return "gold";
    case "challenge":
      return "purple";
    case "log_only":
      return "blue";
    case "allow":
      return "green";
    default:
      return "default";
  }
};

interface Props {
  rows: LogRow[];
  loading: boolean;
  pageSize: number;
  setPageSize: (n: number) => void;
  /** Click → set client_ip filter to this value upstream. */
  onFilterClientIp: (ip: string) => void;
  /** Click → set rule_name filter to this value upstream. */
  onFilterRuleName: (rule: string) => void;
}

export const LogsTable: React.FC<Props> = ({
  rows,
  loading,
  pageSize,
  setPageSize,
  onFilterClientIp,
  onFilterRuleName,
}) => {
  const columns: ColumnsType<LogRow> = [
    {
      title: "Time",
      dataIndex: "_time",
      width: 180,
      render: (v: string | undefined) => (
        <span style={{ color: "#8c8c8c", fontSize: 12 }}>{v ? fmtDateTime(v) : "—"}</span>
      ),
    },
    {
      title: "Event",
      dataIndex: "event_type",
      width: 100,
      render: (v: string | undefined) =>
        v ? <Tag color={eventTypeColor(v)}>{v}</Tag> : <Tag>—</Tag>,
    },
    {
      title: "Rule",
      dataIndex: "rule_name",
      width: 200,
      ellipsis: true,
      render: (v: string | undefined) =>
        v ? (
          <Space size={4}>
            <span title={v}>{v}</span>
            <Button
              size="small"
              type="text"
              icon={<FilterOutlined />}
              onClick={() => onFilterRuleName(v)}
              title="Filter by this rule"
            />
          </Space>
        ) : (
          "—"
        ),
    },
    {
      title: "Client IP",
      dataIndex: "client_ip",
      width: 170,
      render: (v: string | undefined) =>
        v ? (
          <Space size={4}>
            <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 12 }}>{v}</span>
            <Button
              size="small"
              type="text"
              icon={<FilterOutlined />}
              onClick={() => onFilterClientIp(v)}
              title="Filter by this IP"
            />
          </Space>
        ) : (
          "—"
        ),
    },
    { title: "Host", dataIndex: "host", width: 160, ellipsis: true },
    {
      title: "Tier",
      dataIndex: "tier",
      width: 100,
      render: (v: string | undefined) => (v ? <Tag>{v}</Tag> : "—"),
    },
    {
      title: "Detail",
      dataIndex: "detail",
      ellipsis: true,
      render: (v, row) => {
        const display = v ?? row._msg;
        return (
          <span
            style={{ fontFamily: "ui-monospace, monospace", fontSize: 12 }}
            title={typeof display === "string" ? display : ""}
          >
            {display ?? "—"}
          </span>
        );
      },
    },
  ];

  return (
    <Table<LogRow>
      rowKey="__rowKey"
      size="small"
      dataSource={rows}
      columns={columns}
      loading={loading}
      pagination={{
        pageSize,
        showSizeChanger: true,
        pageSizeOptions: [50, 100, 500],
        onShowSizeChange: (_c, ps) => setPageSize(ps),
        showTotal: (n) => `Total: ${n}`,
      }}
      expandable={{
        expandedRowRender: (row) => (
          <Typography.Paragraph style={{ marginBottom: 0 }}>
            <pre style={{ fontSize: 12, margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
              {JSON.stringify(row, null, 2)}
            </pre>
          </Typography.Paragraph>
        ),
      }}
      scroll={{ x: 1200 }}
      locale={{ emptyText: "No log entries match your filters" }}
    />
  );
};
