import React, { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Alert,
  Stack,
  Tooltip,
  IconButton,
  FormControlLabel,
  Checkbox,
  TablePagination,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import DownloadIcon from "@mui/icons-material/Download";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { useCookies } from "react-cookie";
import { api } from "utils/urlPrefix";

type BackupFile = {
  filename: string;
  size: number;
  createdAt: string;
};

type OperationLog = {
  id: number;
  type: string;
  status: string;
  targetFile: string;
  message: string;
  requestedBy: string;
  requestedAt: string;
};

const BackupSection: React.FC = () => {
  const [cookies, setCookie] = useCookies([
    "backupLogs_page",
    "backupLogs_rowsPerPage",
  ]);

  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [logs, setLogs] = useState<OperationLog[]>([]);
  const [totalLogs, setTotalLogs] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [logLoading, setLogLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleteFile, setDeleteFile] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // アップロードしてリストア用
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [dropAndRecreatePublic, setDropAndRecreatePublic] = useState(false);

  // ログのページネーション（デフォルト10件表示、Cookieで保存）
  const [rowsPerPage, setRowsPerPage] = useState<number>(
    cookies.backupLogs_rowsPerPage ?? 10
  );
  const [page, setPage] = useState<number>(cookies.backupLogs_page ?? 0);

  // バックアップ一覧取得
  const fetchBackups = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(api("/system/database/backups"));
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      setBackups(json.data.items);
    } catch (e: any) {
      setError("バックアップ一覧の取得に失敗しました: " + e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // 操作履歴取得
  const fetchLogs = useCallback(
    async (count: number, from: number) => {
      setError(null);
      try {
        const res = await fetch(
          api(
            `/system/database/operation-logs?from=${from}&count=${count}`
          )
        );
        const json = await res.json();
        if (!json.success) throw new Error(json.message);
        setLogs(json.data.items);
        setTotalLogs(json.data.total);
      } catch (e: any) {
        setError("操作履歴の取得に失敗しました: " + e.message);
      }
    },
    []
  );

  useEffect(() => {
    fetchBackups();
    fetchLogs(rowsPerPage, page * rowsPerPage);
  }, [fetchBackups, fetchLogs, rowsPerPage, page]);

  // バックアップ作成
  const handleCreate = async () => {
    setCreating(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch(api("/system/database/backup"), {
        method: "POST",
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      setSuccessMsg("バックアップを作成しました: " + json.data?.path);
      fetchBackups();
      fetchLogs(rowsPerPage, page * rowsPerPage);
    } catch (e: any) {
      setError("バックアップの作成に失敗しました: " + e.message);
    } finally {
      setCreating(false);
    }
  };

  // バックアップ削除
  const handleDelete = async () => {
    if (!deleteFile) return;
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch(
        api(`/system/database/backups/${encodeURIComponent(deleteFile)}`),
        { method: "DELETE" }
      );
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      setSuccessMsg(`バックアップ「${deleteFile}」を削除しました。`);
      setDeleteFile(null);
      fetchBackups();
      fetchLogs(rowsPerPage, page * rowsPerPage);
    } catch (e: any) {
      setError("バックアップの削除に失敗しました: " + e.message);
    }
  };

  // バックアップダウンロード
  const handleDownload = useCallback(
    async (filename: string) => {
      setError(null);
      setSuccessMsg(null);
      try {
        const url = api(
          `/system/database/backups/${encodeURIComponent(filename)}/download`
        );

        const res = await fetch(url, {
          method: "GET",
          credentials: "include",
          headers: {},
        });

        const contentType = res.headers.get("Content-Type") || "";

        if (!res.ok) {
          if (contentType.includes("application/json")) {
            const errJson = await res.json();
            setError(
              "バックアップのダウンロードに失敗しました: " +
                (errJson.message || "Download failed")
            );
            return;
          } else {
            const text = await res.text();
            setError(
              "バックアップのダウンロードに失敗しました: " +
                (text || "Download failed")
            );
            return;
          }
        }

        if (!contentType.startsWith("application/sql")) {
          await res.text();
          setError(
            "バックアップのダウンロードに失敗しました: " +
              `想定外のContent-Type: ${contentType}`
          );
          return;
        }

        const blob = await res.blob();
        const disposition = res.headers.get("Content-Disposition") || "";
        const match = disposition.match(/filename="([^"]+)"/);
        const downloadName = match ? match[1] : filename;

        const objectUrl = URL.createObjectURL(blob);
        try {
          const a = document.createElement("a");
          a.href = objectUrl;
          a.download = downloadName;
          document.body.appendChild(a);
          a.click();
          a.remove();
          setSuccessMsg(
            `バックアップ「${downloadName}」をダウンロードしました。`
          );
        } finally {
          setTimeout(() => URL.revokeObjectURL(objectUrl), 10000);
        }
      } catch (e: any) {
        setError("バックアップのダウンロードに失敗しました: " + e.message);
      }
    },
    [setError, setSuccessMsg]
  );

  // アップロードファイル選択
  const handleSelectFile = (ev: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setSuccessMsg(null);
    const f = ev.target.files?.[0] || null;
    if (!f) {
      setRestoreFile(null);
      return;
    }
    if (!/\.sql$/i.test(f.name)) {
      setRestoreFile(null);
      setError("拡張子 .sql のファイルを選択してください。");
      return;
    }
    const maxBytes = 100 * 1024 * 1024;
    if (f.size <= 0 || f.size > maxBytes) {
      setRestoreFile(null);
      setError("ファイルが空か、サイズが大きすぎます（最大100MB）。");
      return;
    }
    setRestoreFile(f);
  };

  // アップロードしてリストア（サーバ側は常にpublicを再作成）
  const handleRestoreUpload = async () => {
    if (!restoreFile) {
      setError("リストアする .sql ファイルを選択してください。");
      return;
    }
    setRestoring(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const fd = new FormData();
      fd.append("file", restoreFile);
      if (dropAndRecreatePublic) {
        // サーバ側では無視されるが、互換のため送信可
        fd.append("dropAndRecreatePublic", "true");
      }

      const res = await fetch(api("/system/database/backups/restore-upload"), {
        method: "POST",
        body: fd,
      });

      const ct = res.headers.get("Content-Type") || "";
      let json: any = null;

      if (ct.includes("application/json")) {
        json = await res.json();
      } else {
        try {
          json = await res.clone().json();
        } catch {
          json = null;
        }
      }

      if (!res.ok || (json && json.success === false)) {
        let msg =
          (json && typeof json.message === "string" && json.message) || "";

        if (!msg) {
          switch (res.status) {
            case 401:
              msg = "認証が必要です。再度ログインしてください。";
              break;
            case 403:
              msg = "権限がありません。";
              break;
            case 413:
              msg = "ファイルが大きすぎます（最大100MB）。";
              break;
            case 400:
              msg = "入力が不正です。";
              break;
            default:
              try {
                const txt = await res.text();
                msg =
                  (txt && txt.slice(0, 500)) ||
                  "Restore failed (no error detail).";
              } catch {
                msg = "Restore failed.";
              }
          }
        }

        if (json && typeof json.code === "string" && json.code) {
          msg += ` [${json.code}]`;
        }

        throw new Error(msg);
      }

      const okMsg =
        (json && typeof json.message === "string" && json.message) ||
        "アップロードしたSQLでリストアしました。";
      setSuccessMsg(okMsg);

      setRestoreFile(null);
      fetchLogs(rowsPerPage, page * rowsPerPage);
    } catch (e: any) {
      setError("リストアに失敗しました: " + (e?.message || "Restore failed."));
    } finally {
      setRestoring(false);
    }
  };

  // ページ変更
  const onPageChange = (_: React.MouseEvent | null, newPage: number) => {
    setPage(newPage);
    setCookie("backupLogs_page", newPage);
    fetchLogs(rowsPerPage, newPage * rowsPerPage);
  };

  // 1ページあたり件数変更
  const onRowsPerPageChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const count = parseInt(event.target.value, 10);
    setPage(0);
    setCookie("backupLogs_page", 0);
    setRowsPerPage(count);
    setCookie("backupLogs_rowsPerPage", count);
    fetchLogs(count, 0);
  };

  return (
    <Box>
      <Stack direction="row" spacing={2} mb={2} alignItems="center">
        <Button
          variant="contained"
          color="primary"
          onClick={handleCreate}
          disabled={creating}
        >
          {creating ? <CircularProgress size={20} /> : "バックアップを作成"}
        </Button>

        <Button variant="outlined" onClick={fetchBackups} disabled={loading}>
          一覧を更新
        </Button>
      </Stack>

      {/* アップロードしてリストア */}
      <Box
        sx={{
          border: (theme) => `1px solid ${theme.palette.divider}`,
          borderRadius: 1,
          p: 2,
          mb: 2,
        }}
      >
        <Typography variant="subtitle1" gutterBottom>
          アップロードしたSQLでリストア
        </Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          <Button
            variant="outlined"
            component="label"
            startIcon={<UploadFileIcon />}
            disabled={restoring}
          >
            ファイルを選択
            <input
              type="file"
              accept=".sql"
              hidden
              onChange={handleSelectFile}
            />
          </Button>
          <Typography variant="body2" sx={{ minWidth: 220 }}>
            {restoreFile ? restoreFile.name : "選択されていません"}
          </Typography>
          <Button
            variant="contained"
            color="secondary"
            onClick={handleRestoreUpload}
            disabled={!restoreFile || restoring}
          >
            {restoring ? <CircularProgress size={20} /> : "アップロードしてリストア"}
          </Button>
        </Stack>
        <FormControlLabel
          sx={{ mt: 1 }}
          control={
            <Checkbox
              checked={dropAndRecreatePublic}
              onChange={(e) => setDropAndRecreatePublic(e.target.checked)}
            />
          }
          label="リストア前に public スキーマを削除して再作成する（破壊的）"
        />
        <Typography variant="caption" color="text.secondary">
          対応拡張子: .sql（最大100MB）
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {successMsg && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {successMsg}
        </Alert>
      )}

      <Typography variant="h6" gutterBottom>
        バックアップファイル一覧
      </Typography>
      {loading ? (
        <CircularProgress />
      ) : (
        <TableContainer component={Paper} sx={{ mb: 4 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>ファイル名</TableCell>
                <TableCell>作成日時</TableCell>
                <TableCell align="right">サイズ (bytes)</TableCell>
                <TableCell>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {backups.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4}>バックアップはありません。</TableCell>
                </TableRow>
              ) : (
                backups.map((b) => (
                  <TableRow key={b.filename}>
                    <TableCell>{b.filename}</TableCell>
                    <TableCell>
                      {b.createdAt
                        ? new Date(b.createdAt).toLocaleString()
                        : "-"}
                    </TableCell>
                    <TableCell align="right">{b.size}</TableCell>
                    <TableCell>
                      <Tooltip title="ダウンロード">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleDownload(b.filename)}
                        >
                          <DownloadIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="削除">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => setDeleteFile(b.filename)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Typography variant="h6" gutterBottom>
        操作履歴
      </Typography>
      {logLoading ? (
        <CircularProgress />
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>日時</TableCell>
                <TableCell>種類</TableCell>
                <TableCell>結果</TableCell>
                <TableCell>ファイル</TableCell>
                <TableCell>ユーザー</TableCell>
                <TableCell>メッセージ</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>操作履歴はありません。</TableCell>
                </TableRow>
              ) : (
                logs.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell>
                      {l.requestedAt
                        ? new Date(l.requestedAt).toLocaleString()
                        : "-"}
                    </TableCell>
                    <TableCell>{l.type}</TableCell>
                    <TableCell>{l.status}</TableCell>
                    <TableCell>{l.targetFile}</TableCell>
                    <TableCell>{l.requestedBy}</TableCell>
                    <TableCell>{l.message}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[10, 25, 50, 100, 500, 1000]}
            component="div"
            count={totalLogs}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={onPageChange}
            onRowsPerPageChange={onRowsPerPageChange}
          />
        </TableContainer>
      )}

      <Dialog open={!!deleteFile} onClose={() => setDeleteFile(null)}>
        <DialogTitle>バックアップ削除</DialogTitle>
        <DialogContent>
          <DialogContentText>
            バックアップ「{deleteFile}」を削除します。よろしいですか？
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDelete} color="error" variant="contained">
            削除
          </Button>
          <Button onClick={() => setDeleteFile(null)}>キャンセル</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BackupSection;
