# TODO List for Receipt Number Reset

- [x] Analyze the current receipt generation logic in api/transaction.py
- [x] Identify the query responsible for generating rcpt_sl_no
- [x] Modify the query to include date filter for daily reset per branch
- [x] Update the query: SELECT ifnull(max(rcpt_sl_no), 0)+1 as rcpt_sl_no FROM `td_receipt` WHERE comp_id={i.comp_id} AND br_id={i.br_id} AND DATE(trn_date) = '{curr_date}'
- [x] Test the application to verify receipts start from 1 daily for each branch
