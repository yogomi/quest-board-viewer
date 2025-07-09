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

type PartyData = {
  id: string,
  partyName: string,
  leaderId: string,
  maxNumberOfMembers: number,
  createdAt: Date,
  updatedAt: Date,
}

function AddPartyDialog() {
  const [open, setOpen] = React.useState<boolean>(false);
  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  }

  return (
    <React.Fragment>
      <Button variant="contained" onClick={() => handleClickOpen()}>パーティーを作成</Button>
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
              console.log(formJson)

              fetch(`/quest-board/api/v1/parties`, {
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
        <DialogTitle>パーティー作成</DialogTitle>
        <TextField
          autoFocus
          required
          margin="dense"
          id="name"
          name="partyName"
          label="パーティー名"
          type="text"
          fullWidth
          variant="standard"
        ></TextField>
        <TextField
          required
          margin="dense"
          id="name"
          name="description"
          label="概要(オプション)"
          type="text"
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

function PartyTableBody({
  partyList,
}: {
  partyList: PartyData[],
}) {
  return (
    <TableBody>
      {partyList.map(party => (
        <PartyRow
          key={party.id}
          party={party}
        />
      ))}
    </TableBody>
  );
}


export default function PartyList() {
  const [cookies, setCookie] = useCookies([
                                  'partyList_page',
                                  'partyList_rowsPerPage'
                                ]);
  const [partyList, setPartyList] = useState<PartyData[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] =
                useState<number>(cookies.partyList_rowsPerPage ?? 25);
  const [page, setPage] = useState<number>(cookies.partyList_page ?? 0);
  const [hasData, setHasData] = useState<boolean>(false);

  const loadParties = (count: number, from: number) => {

    const getPartyList = async (): Promise<{totalCount: number, parties: PartyData[]}> => {
      const res = await fetch(`/quest-board/api/v1/parties?from=${from}&count=${count}`,
        {method: 'GET'});
      const response = await res.json();
      const parties = response.data.parties as PartyData[];
      const totalCount = response.data.totalCount as number;
      return {totalCount, parties};
    }

    let parties: PartyData[] = [];
    getPartyList()
      .then(receivedData => {
        parties = parties.concat(receivedData.parties);
        setPartyList(parties);
        setTotalCount(receivedData.totalCount);
        setHasData(true);
      });
  }

  useEffect(() => loadParties(rowsPerPage, page * rowsPerPage), []);
  const onRowsPerPageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const count = parseInt(event.target.value);
    setPage(0);
    setCookie('partyList_page', 0)
    setRowsPerPage(count);
    setCookie('partyList_rowsPerPage', count);
    loadParties(count, 0);
  }
  const onPageChange = (event: React.MouseEvent | null, page: number) => {
    setPage(page);
    setCookie('partyList_page', page)
    loadParties(rowsPerPage, page * rowsPerPage);
  }

  if (hasData === false) {
    return <CircularProgress />;
  } else {
    return (
      <React.Fragment>
        <Button variant="contained" onClick={() =>
                                  loadParties(rowsPerPage, page * rowsPerPage)}>更新</Button>
        <AddPartyDialog />
        <Box sx={{ margin: 1 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>パーティーID</TableCell>
                <TableCell>パーティー名</TableCell>
                <TableCell>リーダーID</TableCell>
                <TableCell>最大人数</TableCell>
                <TableCell>作成日時</TableCell>
              </TableRow>
            </TableHead>
            <PartyTableBody
              partyList={partyList}
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

function PartyRow({ party }: {
  party: PartyData,
}) {
  return (
    <TableRow>
      <TableCell>{party.id}</TableCell>
      <TableCell>{party.partyName}</TableCell>
      <TableCell>{party.leaderId}</TableCell>
      <TableCell>{party.maxNumberOfMembers}</TableCell>
      <TableCell>{party.createdAt.toString()}</TableCell>
    </TableRow>
  );
}
