import React, {useState, useEffect} from 'react';
import { Link } from 'react-router-dom';
import {
  CircularProgress,
  Box,
  Table,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableBody,
  TablePagination,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
} from "@mui/material";
import { useCookies } from 'react-cookie';

type UserData = {
  id: string,
  loginId: string,
  nickname: string,
  rank: number,
  guildStaff: boolean,
  privateInformationRegistered: boolean,
  auth_type: string,
  referralId: string,
  comment: string,
  partyId: string,
  enabled: string,
  createdAt: Date,
  updatedAt: Date,
}

function AddUserDialog() {
  const [open, setOpen] = React.useState<boolean>(false);
  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  }

  return (
    <React.Fragment>
      <Button variant="contained" onClick={() => handleClickOpen()}>ユーザーを追加</Button>
      <Button
        variant="contained"
        component={Link}
        to="/quest-board/user/bulk-add-users">ユーザー一括追加</Button>
      <Dialog
        open={open}
        onClose={handleClose}
        slotProps={{
          paper: {
            component: 'form',
            onSubmit: (event: React.FormEvent<HTMLFormElement>) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              const formJson = Object.fromEntries((formData as any).entries());
              const email = formJson.email;
              console.log(formJson)

              fetch(`/quest-board/api/v1/users`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify(formJson),
              })
                .then(res => res.json())
                .then(response => {
                  console.log(response)
                  handleClose();
                })
            }
          }
        }}
      >
        <DialogTitle>ユーザー追加</DialogTitle>
        <TextField
          autoFocus
          required
          margin="dense"
          id="name"
          name="loginId"
          label="ログインID"
          type="text"
          fullWidth
          variant="standard"
        ></TextField>
        <TextField
          required
          margin="dense"
          id="name"
          name="passwordDigest"
          label="パスワード"
          type="password"
          fullWidth
          variant="standard"
        ></TextField>
        <TextField
          required
          margin="dense"
          id="name"
          name="newEmail"
          label="メールアドレス"
          type="email"
          fullWidth
          variant="standard"
        ></TextField>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button type="submit">追加</Button>
        </DialogActions>
      </Dialog>
      
  </ React.Fragment>
  );
}

function UserTableBody({userSummary}: {userSummary: UserData[]}) {
  return (
    <TableBody>{
      userSummary.map((user: UserData) => {
        return <UserRow
                  key={user.id}
                  user={user}
                />;
      })
    }</TableBody>
  );
}

export default function UserSummary() {
  const [cookies, setCookie] = useCookies([
                                  'userSummary_page',
                                  'userSummary_rowsPerPage'
                                ]);
  const [userSummary, setUserSummary] = useState<UserData[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] =
                useState<number>(cookies.userSummary_rowsPerPage ?? 25);
  const [page, setPage] = useState<number>(cookies.userSummary_page ?? 0);
  const [hasData, setHasData] = useState<boolean>(false);

  const loadUsers = (count: number, from: number) => {

    const getUserList = async (): Promise<{totalCount: number, users: UserData[]}> => {
      const res = await fetch(`/quest-board/api/v1/users?from=${from}&count=${count}`,
        {method: 'GET'});
      const response = await res.json();
      const users = response.data.users as UserData[];
      // const users = data.map((m): UserData => {
      //   return {
      //     meetingId: m.meetingId,
      //     tenantId: m.tenantId,
      //     roomGroupId: m.roomGroupId,
      //     startDate: m.startDate !== null ? new Date(m.startDate) : null,
      //     endDate: m.endDate !== null ? new Date(m.endDate) : null,
      //     logArchiveStatus: m.logArchiveStatus,
      //     logArchiveProgress: m.logArchiveProgress,
      //     logArchiveFilename: m.logArchiveFilename,
      //   };
      // });
      const totalCount = response.data.totalCount as number;
      return {totalCount, users};
    }

    let users: UserData[] = [];
    getUserList()
      .then(receivedData => {
        users = users.concat(receivedData.users);
        setUserSummary(users);
        setTotalCount(receivedData.totalCount);
        setHasData(true);
      });
  }

  useEffect(() => loadUsers(rowsPerPage, page * rowsPerPage), []);
  const onRowsPerPageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const count = parseInt(event.target.value);
    setPage(0);
    setCookie('userSummary_page', 0)
    setRowsPerPage(count);
    setCookie('userSummary_rowsPerPage', count);
    loadUsers(count, 0);
  }
  const onPageChange = (event: React.MouseEvent | null, page: number) => {
    setPage(page);
    setCookie('userSummary_page', page)
    loadUsers(rowsPerPage, page * rowsPerPage);
  }

  if (hasData === false) {
    return <CircularProgress />;
  } else {
    return (
      <React.Fragment>
        <Button variant="contained" onClick={() =>
                                  loadUsers(rowsPerPage, page * rowsPerPage)}>更新</Button>
        <AddUserDialog />
        <Box sx={{ margin: 1 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ユーザーID</TableCell>
                <TableCell>ログインID</TableCell>
                <TableCell>ニックネーム</TableCell>
                <TableCell>ランク</TableCell>
                <TableCell>ギルドスタッフ</TableCell>
                <TableCell>プライベート情報登録</TableCell>
                <TableCell>作成日時</TableCell>
              </TableRow>
            </TableHead>
            <UserTableBody
              userSummary={userSummary}
            />
          </Table>
          <TablePagination
            rowsPerPageOptions={[10, 25, 50, 100, 500, 1000]}
            component="div"
            count={totalCount}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={onPageChange}
            onRowsPerPageChange={onRowsPerPageChange}
          />
        </Box>
      </React.Fragment>
    );
  }
}

function UserRow({user}: {user: UserData}) {
  return (
    <TableRow>
      <TableCell>{user.id}</TableCell>
      <TableCell>{user.loginId}</TableCell>
      <TableCell>{user.nickname}</TableCell>
      <TableCell>{user.rank}</TableCell>
      <TableCell>{user.guildStaff.toString()}</TableCell>
      <TableCell>{user.privateInformationRegistered.toString()}</TableCell>
      <TableCell>{user.createdAt.toString()}</TableCell>
    </TableRow>
  );
}
