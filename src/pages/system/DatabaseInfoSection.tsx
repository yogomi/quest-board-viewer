import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { api } from "utils/urlPrefix";

type ServerInfo = {
  version: string;
  serverVersion: string;
  versionNum: string;
  currentDatabase: string;
  currentUser: string;
  uptimeSeconds: number;
  sizeBytes: number;
};

type ColumnInfo = {
  name: string;
  dataType: string;
  isNullable: boolean;
  default: string | null;
};

type TableInfo = {
  name: string;
  columns?: ColumnInfo[];
};

type SchemaInfo = {
  name: string;
  tables: TableInfo[];
};

type DatabaseInfoResponse = {
  success: boolean;
  code: string;
  message: string;
  data: {
    server: ServerInfo;
    schemas: SchemaInfo[];
  };
};

function formatBytes(bytes: number): string {
  if (Number.isNaN(bytes) || bytes < 0) return "-";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let n = bytes;
  let i = 0;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i += 1;
  }
  return `${n.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "-";
  const s = Math.floor(seconds);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0 || d > 0) parts.push(`${h}h`);
  if (m > 0 || h > 0 || d > 0) parts.push(`${m}m`);
  parts.push(`${sec}s`);
  return parts.join(" ");
}

const DatabaseInfoSection: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [server, setServer] = useState<ServerInfo | null>(null);
  const [schemas, setSchemas] = useState<SchemaInfo[]>([]);
  const [includeColumns, setIncludeColumns] = useState(true);
  const [allSchemas, setAllSchemas] = useState(false);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (includeColumns) params.set("includeColumns", "true");
    if (allSchemas) params.set("schema", "all");
    const s = params.toString();
    return s ? `?${s}` : "";
  }, [includeColumns, allSchemas]);

  const loadInfo = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(api(`/system/database/info${queryString}`));
      const json: DatabaseInfoResponse = await res.json();
      if (!json.success) {
        throw new Error(json.message || "Failed to load database info.");
      }
      setServer(json.data.server);
      setSchemas(json.data.schemas || []);
    } catch (e: any) {
      setErrorMsg(
        e?.message || "Failed to load database info due to network error."
      );
    } finally {
      setLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    loadInfo();
  }, [loadInfo]);

  return (
    <Box>
      <Stack direction="row" spacing={2} alignItems="center" mb={2}>
        <FormControlLabel
          control={
            <Checkbox
              checked={allSchemas}
              onChange={(ev) => setAllSchemas(ev.target.checked)}
            />
          }
          label="全スキーマを対象（システムスキーマ除外）"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={includeColumns}
              onChange={(ev) => setIncludeColumns(ev.target.checked)}
            />
          }
          label="カラム情報を含める"
        />
        <Button variant="outlined" onClick={loadInfo} disabled={loading}>
          更新
        </Button>
      </Stack>

      {errorMsg && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errorMsg}
        </Alert>
      )}

      {loading && (
        <Box sx={{ mb: 2 }}>
          <CircularProgress />
        </Box>
      )}

      {server && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            サーバー情報
          </Typography>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={4}
            useFlexGap
            flexWrap="wrap"
          >
            <Box>
              <Typography variant="body2" color="text.secondary">
                バージョン
              </Typography>
              <Typography>{server.version}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                server_version
              </Typography>
              <Typography>{server.serverVersion}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                version_num
              </Typography>
              <Typography>{server.versionNum}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                データベース
              </Typography>
              <Typography>{server.currentDatabase}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                ユーザー
              </Typography>
              <Typography>{server.currentUser}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                稼働時間
              </Typography>
              <Typography>{formatDuration(server.uptimeSeconds)}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                DBサイズ
              </Typography>
              <Typography>
                {formatBytes(server.sizeBytes)} ({server.sizeBytes} bytes)
              </Typography>
            </Box>
          </Stack>
        </Paper>
      )}

      <Typography variant="h6" gutterBottom>
        スキーマ・テーブル
      </Typography>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: "20%" }}>スキーマ</TableCell>
              <TableCell sx={{ width: "25%" }}>テーブル</TableCell>
              <TableCell sx={{ width: "10%" }} align="right">
                カラム数
              </TableCell>
              {includeColumns && <TableCell>カラム一覧</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {schemas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={includeColumns ? 4 : 3}>
                  対象となるテーブルがありません。
                </TableCell>
              </TableRow>
            ) : (
              schemas.flatMap((sc) =>
                sc.tables.length === 0
                  ? [
                      <TableRow key={`${sc.name}-__empty`}>
                        <TableCell>{sc.name}</TableCell>
                        <TableCell colSpan={includeColumns ? 3 : 2}>
                          テーブルなし
                        </TableCell>
                      </TableRow>,
                    ]
                  : sc.tables.map((tb) => {
                      const colCount = tb.columns?.length ?? 0;
                      const columnsStr = includeColumns
                        ? (tb.columns || [])
                            .map(
                              (c) =>
                                `${c.name} (${c.dataType}${
                                  c.isNullable ? ", null" : ""
                                }${
                                  c.default ? `, default=${c.default}` : ""
                                })`
                            )
                            .join(", ")
                        : "";
                      return (
                        <TableRow key={`${sc.name}.${tb.name}`}>
                          <TableCell>{sc.name}</TableCell>
                          <TableCell>{tb.name}</TableCell>
                          <TableCell align="right">{colCount}</TableCell>
                          {includeColumns && <TableCell>{columnsStr}</TableCell>}
                        </TableRow>
                      );
                    })
              )
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default DatabaseInfoSection;
