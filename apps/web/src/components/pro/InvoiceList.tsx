import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  CircularProgress,
  Alert,
  Tooltip,
} from '@mui/material'
import DownloadIcon from '@mui/icons-material/Download'
import VisibilityIcon from '@mui/icons-material/Visibility'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import css from './styles.module.css'
import type { GetInvoicesResultDto, Invoice } from './types'
import { getCustomerInvoices } from '@/services/pro/api'
import { useCurrentSpaceId } from '@/features/spaces/hooks/useCurrentSpaceId'

interface InvoiceListProps {
  onGoBack: () => void
}

const InvoiceList: React.FC<InvoiceListProps> = ({ onGoBack }) => {
  const spaceId = useCurrentSpaceId()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  useEffect(() => {
    const fetchInvoices = async () => {
      if (!spaceId) {
        setLoading(false)
        setError('No spaceId provided')
        return
      }

      setLoading(true)
      const result: GetInvoicesResultDto = await getCustomerInvoices(spaceId as string, 0, 0)
      setInvoices(result.invoices)
      setError(null)

      setLoading(false)
    }

    fetchInvoices()
  }, [spaceId, page])

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100)
  }

  return (
    <Box className={css.invoiceContainer}>
      <Paper elevation={2} className={css.invoicePaper}>
        <Box display="flex" alignItems="center" mb={3}>
          <IconButton onClick={onGoBack} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1" fontWeight="500">
            Billing History
          </Typography>
        </Box>

        <Typography variant="body1" color="text.secondary" paragraph>
          View and download your past invoices and payment history
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : invoices.length === 0 ? (
          <Alert severity="info" sx={{ mb: 3 }}>
            No invoices found for this wallet.
          </Alert>
        ) : (
          <>
            <TableContainer>
              <Table sx={{ minWidth: 650 }} aria-label="invoices table">
                <TableHead>
                  <TableRow>
                    <TableCell>Invoice ID</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invoices.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((invoice) => (
                    <TableRow key={invoice.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell component="th" scope="row">
                        {invoice.id}
                      </TableCell>
                      <TableCell>{formatDate(invoice.created)}</TableCell>
                      <TableCell>{formatAmount(invoice.amount_paid)}</TableCell>
                      <TableCell></TableCell>
                      <TableCell align="right">
                        <Tooltip title="View Invoice">
                          <IconButton
                            color="primary"
                            aria-label="view invoice"
                            onClick={() => window.open(invoice.url, '_blank')}
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Download PDF">
                          <IconButton
                            color="secondary"
                            aria-label="download invoice"
                            onClick={() => window.open(invoice.invoice_pdf, '_blank')}
                          >
                            <DownloadIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={invoices.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </>
        )}
      </Paper>
    </Box>
  )
}

export default InvoiceList
