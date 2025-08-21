import React, { useCallback, useEffect, useState } from "react"
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
} from "@mui/material"
import DeleteIcon from "@mui/icons-material/Delete"
import DownloadIcon from "@mui/icons-material/Download"

type BackupFile = {
  filename: string
  size: number
  createdAt: string
}

type OperationLog = {
  id: number
  type: string
  status: string
  targetFile: string
  message: string
  requestedBy: string
  requestedAt: string
}

const BackupSection: React.FC = () => {
  const [backups, setBackups] = useState<BackupFile[]>([])
  const [logs, setLogs] = useState<OperationLog[]>([])
  const [loading, setLoading] = useState(false)
  const [logLoading, setLogLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [deleteFile, setDeleteFile] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // バックアップ一覧取得
  const fetchBackups = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/quest-board/api/v1/system/database/backups")
      const json = await res.json()
      if (!json.success) throw new Error(json.message)
      setBackups(json.data.items)
    } catch (e: any) {
      setError("バックアップ一覧の取得に失敗しました: " + e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // 操作履歴取得
  const fetchLogs = useCallback(async () => {
    setLogLoading(true)
    setError(null)
    try {
      const res = await fetch("/quest-board/api/v1/system/database/operation-logs?count=20")
      const json = await res.json()
      if (!json.success) throw new Error(json.message)
      setLogs(json.data.items)
    } catch (e: any) {
      setError("操作履歴の取得に失敗しました: " + e.message)
    } finally {
      setLogLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBackups()
    fetchLogs()
  }, [fetchBackups, fetchLogs])

  // バックアップ作成
  const handleCreate = async () => {
    setCreating(true)
    setError(null)
    setSuccessMsg(null)
    try {
      const res = await fetch("/quest-board/api/v1/system/database/backup", { method: "POST" })
      const json = await res.json()
      if (!json.success) throw new Error(json.message)
      setSuccessMsg("バックアップを作成しました: " + json.data?.path)
      fetchBackups()
      fetchLogs()
    } catch (e: any) {
      setError("バックアップの作成に失敗しました: " + e.message)
    } finally {
      setCreating(false)
    }
  }

  // バックアップ削除
  const handleDelete = async () => {
    if (!deleteFile) return
    setError(null)
    setSuccessMsg(null)
    try {
      const res = await fetch(
        `/quest-board/api/v1/system/database/backups/${encodeURIComponent(deleteFile)}`,
        { method: "DELETE" }
      )
      const json = await res.json()
      if (!json.success) throw new Error(json.message)
      setSuccessMsg(`バックアップ「${deleteFile}」を削除しました。`)
      setDeleteFile(null)
      fetchBackups()
      fetchLogs()
    } catch (e: any) {
      setError("バックアップの削除に失敗しました: " + e.message)
    }
  }

  // バックアップダウンロード
  const handleDownload = (filename: string) => {
    window.open(
      `/quest-board/api/v1/system/database/backups/${encodeURIComponent(filename)}/download`,
      "_blank"
    )
  }

  return (
    <Box>
      <Stack direction="row" spacing={2} mb={2}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleCreate}
          disabled={creating}
        >
          {creating ? <CircularProgress size={20} /> : "バックアップを作成"}
        </Button>
        <Button
          variant="outlined"
          onClick={fetchBackups}
          disabled={loading}
        >
          一覧を更新
        </Button>
      </Stack>

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
        </TableContainer>
      )}

      <Dialog
        open={!!deleteFile}
        onClose={() => setDeleteFile(null)}
      >
        <DialogTitle>バックアップ削除</DialogTitle>
        <DialogContent>
          <DialogContentText>
            バックアップ「{deleteFile}」を削除します。よろしいですか？
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
          >
            削除
          </Button>
          <Button onClick={() => setDeleteFile(null)}>キャンセル</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default BackupSection
