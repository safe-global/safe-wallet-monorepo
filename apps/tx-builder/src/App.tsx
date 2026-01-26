import { Routes, Route } from 'react-router-dom'

import Header from './components/Header'
import CreateTransactions from './pages/CreateTransactions'
import Dashboard from './pages/Dashboard'
import EditTransactionLibrary from './pages/EditTransactionLibrary'
import ReviewAndConfirm from './pages/ReviewAndConfirm'
import SaveTransactionLibrary from './pages/SaveTransactionLibrary'
import TransactionLibrary from './pages/TransactionLibrary'
import {
  HOME_PATH,
  EDIT_BATCH_PATH,
  REVIEW_AND_CONFIRM_PATH,
  SAVE_BATCH_PATH,
  TRANSACTION_LIBRARY_PATH,
} from './routes/routes'

const App = () => {
  return (
    <>
      {/* App Header */}
      <Header />

      <Routes>
        {/* Dashboard Screen (Create transactions) */}
        <Route path={HOME_PATH} element={<Dashboard />}>
          {/* Transactions Batch section */}
          <Route index element={<CreateTransactions />} />

          {/* Save Batch section */}
          <Route path={SAVE_BATCH_PATH} element={<SaveTransactionLibrary />} />

          {/* Edit Batch section */}
          <Route path={EDIT_BATCH_PATH} element={<EditTransactionLibrary />} />
        </Route>

        {/* Review & Confirm Screen */}
        <Route path={REVIEW_AND_CONFIRM_PATH} element={<ReviewAndConfirm />} />

        {/* Transaction Library Screen */}
        <Route path={TRANSACTION_LIBRARY_PATH} element={<TransactionLibrary />} />
      </Routes>
    </>
  )
}

export default App
