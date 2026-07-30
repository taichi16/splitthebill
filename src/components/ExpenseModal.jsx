import React, { useState, useEffect } from 'react';
import { Utensils, Car, Bed, Ticket, ShoppingBag, HelpCircle, CheckSquare, Square, Calculator, Heart } from 'lucide-react';

export const CATEGORIES = [
  { id: 'dining', name: '餐飲美食', icon: Utensils, color: '#f97316' },
  { id: 'transport', name: '交通油資', icon: Car, color: '#3b82f6' },
  { id: 'lodging', name: '飯店住宿', icon: Bed, color: '#8b5cf6' },
  { id: 'entertainment', name: '景點娛樂', icon: Ticket, color: '#ec4899' },
  { id: 'shopping', name: '購物消費', icon: ShoppingBag, color: '#10b981' },
  { id: 'other', name: '其他雜項', icon: HelpCircle, color: '#64748b' }
];

export default function ExpenseModal({ show, onClose, onSave, editingExpense, members }) {
  if (!show) return null;

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('dining');
  const [amount, setAmount] = useState('');
  const [payerId, setPayerId] = useState(members[0]?.id || '');
  const [beneficiaryIds, setBeneficiaryIds] = useState(members.map(m => m.id));
  const [splitType, setSplitType] = useState('equal'); // Default to equal for simple intuitiveness
  const [customShares, setCustomShares] = useState({});
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const memberMap = {};
  members.forEach(m => { memberMap[m.id] = m; });

  useEffect(() => {
    if (editingExpense) {
      setTitle(editingExpense.title || '');
      setCategory(editingExpense.category || 'dining');
      setAmount(editingExpense.amount || '');
      setPayerId(editingExpense.payerId || members[0]?.id || '');
      setBeneficiaryIds(editingExpense.beneficiaryIds || members.map(m => m.id));
      setSplitType(editingExpense.splitType || 'equal');
      setCustomShares(editingExpense.customShares || {});
      setNotes(editingExpense.notes || '');
      setDate(editingExpense.date || new Date().toISOString().split('T')[0]);
    } else {
      setTitle('');
      setCategory('dining');
      setAmount('');
      setPayerId(members[0]?.id || '');
      setBeneficiaryIds(members.map(m => m.id));
      setSplitType('equal');
      setNotes('');
      setDate(new Date().toISOString().split('T')[0]);

      // Initialize child defaults
      const defaults = {};
      members.forEach(m => {
        if (m.type === 'child') defaults[m.id] = 200;
        else defaults[m.id] = 1.0;
      });
      setCustomShares(defaults);
    }
  }, [editingExpense, members, show]);

  const toggleBeneficiary = (id) => {
    if (beneficiaryIds.includes(id)) {
      setBeneficiaryIds(beneficiaryIds.filter(bId => bId !== id));
    } else {
      setBeneficiaryIds([...beneficiaryIds, id]);
    }
  };

  const selectAllBeneficiaries = () => {
    setBeneficiaryIds(members.map(m => m.id));
  };

  const selectAdultsOnly = () => {
    setBeneficiaryIds(members.filter(m => m.type === 'adult').map(m => m.id));
  };

  const clearBeneficiaries = () => {
    setBeneficiaryIds([]);
  };

  const handleCustomShareChange = (memberId, val) => {
    setCustomShares({
      ...customShares,
      [memberId]: val
    });
  };

  // Preview calculations for split mode
  const totalAmt = Number(amount) || 0;
  const splitShares = {};

  const adultsInExp = beneficiaryIds.filter(id => memberMap[id]?.type === 'adult');
  const childrenInExp = beneficiaryIds.filter(id => memberMap[id]?.type === 'child');

  if (totalAmt > 0 && beneficiaryIds.length > 0) {
    if (splitType === 'equal') {
      const perHead = Math.round(totalAmt / beneficiaryIds.length);
      beneficiaryIds.forEach(id => {
        splitShares[id] = perHead;
      });
    } else if (splitType === 'child_fixed') {
      let childrenSum = 0;
      childrenInExp.forEach(cId => {
        const val = customShares[cId] !== undefined ? Number(customShares[cId]) : 200;
        childrenSum += val;
        splitShares[cId] = val;
      });

      const remain = Math.max(0, totalAmt - childrenSum);
      const perAdult = adultsInExp.length > 0 ? Math.round(remain / adultsInExp.length) : 0;

      adultsInExp.forEach(aId => {
        splitShares[aId] = perAdult;
      });
    } else if (splitType === 'weighted') {
      let totalW = 0;
      beneficiaryIds.forEach(id => {
        const m = memberMap[id];
        const w = customShares[id] !== undefined ? Number(customShares[id]) : (m?.type === 'child' ? 0.5 : 1.0);
        totalW += w;
      });

      if (totalW > 0) {
        beneficiaryIds.forEach(id => {
          const m = memberMap[id];
          const w = customShares[id] !== undefined ? Number(customShares[id]) : (m?.type === 'child' ? 0.5 : 1.0);
          splitShares[id] = Math.round(totalAmt * (w / totalW));
        });
      }
    } else if (splitType === 'custom') {
      beneficiaryIds.forEach(id => {
        splitShares[id] = Number(customShares[id]) || 0;
      });
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return alert('請輸入消費品項名稱！');
    if (!amount || Number(amount) <= 0) return alert('請輸入有效的金額！');
    if (!payerId) return alert('請選擇代付人！');
    if (beneficiaryIds.length === 0) return alert('請至少勾選一位參與分攤的成員！');

    const expData = {
      id: editingExpense?.id || 'e_' + Date.now(),
      title: title.trim(),
      category,
      amount: Number(amount),
      payerId,
      beneficiaryIds,
      splitType,
      customShares,
      notes: notes.trim(),
      date
    };

    onSave(expData);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{editingExpense ? '編輯消費紀錄' : '➕ 新增消費紀錄'}</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Title & Amount */}
          <div className="form-group">
            <label className="form-label">消費品項名稱 *</label>
            <input
              type="text"
              className="form-control"
              placeholder="例如：海鮮晚餐、加油費、包棟民宿"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div className="form-group">
              <label className="form-label">消費金額 (TWD) *</label>
              <input
                type="number"
                className="form-control"
                placeholder="0"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                required
                min="1"
              />
            </div>
            <div className="form-group">
              <label className="form-label">消費類別</label>
              <select
                className="form-select"
                value={category}
                onChange={e => setCategory(e.target.value)}
              >
                {CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Payer dropdown showing couple indicator */}
          <div className="form-group">
            <label className="form-label">誰暫時幫大家付款？(代付者) *</label>
            <select
              className="form-select"
              value={payerId}
              onChange={e => setPayerId(e.target.value)}
            >
              {members.map(m => {
                const spouse = m.spouseId ? memberMap[m.spouseId] : null;
                const coupleText = spouse ? ` (與 ${spouse.name} 夫妻檔代付)` : '';
                return (
                  <option key={m.id} value={m.id}>
                    💳 {m.name} {m.type === 'adult' ? `[大人${coupleText}]` : '[小孩]'}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Split Mode Options */}
          <div className="form-group">
            <label className="form-label">拆帳計算模式</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '6px' }}>
              <button
                type="button"
                className={`btn ${splitType === 'equal' ? 'btn-primary' : 'btn-outline'}`}
                style={{ padding: '8px 4px', fontSize: '0.8rem' }}
                onClick={() => setSplitType('equal')}
              >
                👥 全員均分
              </button>
              <button
                type="button"
                className={`btn ${splitType === 'child_fixed' ? 'btn-primary' : 'btn-outline'}`}
                style={{ padding: '8px 4px', fontSize: '0.8rem' }}
                onClick={() => setSplitType('child_fixed')}
              >
                👶 小孩指定金額 + 大人平分
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              <button
                type="button"
                className={`btn ${splitType === 'weighted' ? 'btn-primary' : 'btn-outline'}`}
                style={{ padding: '8px 4px', fontSize: '0.8rem' }}
                onClick={() => setSplitType('weighted')}
              >
                ⚖️ 權重拆帳 (大人/小孩)
              </button>
              <button
                type="button"
                className={`btn ${splitType === 'custom' ? 'btn-primary' : 'btn-outline'}`}
                style={{ padding: '8px 4px', fontSize: '0.8rem' }}
                onClick={() => setSplitType('custom')}
              >
                ✏️ 全員自訂金額
              </button>
            </div>
          </div>

          {/* Child fixed amount UI */}
          {splitType === 'child_fixed' && (
            <div className="card" style={{ background: 'var(--primary-light)', padding: '12px', marginBottom: '14px' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: '700', marginBottom: '8px', color: 'var(--primary)' }}>
                👶 為小孩輸入固定金額（剩餘將自動由 {adultsInExp.length} 位大人平分）：
              </div>
              {childrenInExp.length === 0 ? (
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>已勾選名單中暫無小孩。</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {childrenInExp.map(cId => {
                    const child = memberMap[cId];
                    return (
                      <div key={cId} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '0.85rem', flex: 1, fontWeight: '600' }}>{child?.name} (小孩)：</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ fontSize: '0.85rem' }}>$</span>
                          <input
                            type="number"
                            className="form-control"
                            style={{ width: '90px', padding: '4px 8px', fontSize: '0.85rem' }}
                            placeholder="0"
                            value={customShares[cId] !== undefined ? customShares[cId] : 200}
                            onChange={e => handleCustomShareChange(cId, e.target.value)}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Beneficiaries Selection */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '4px' }}>
              <label className="form-label" style={{ margin: 0 }}>
                參與成員勾選 ({beneficiaryIds.length}/{members.length} 人)
              </label>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button type="button" className="btn btn-outline" style={{ padding: '2px 6px', fontSize: '0.75rem', minHeight: 'auto' }} onClick={selectAllBeneficiaries}>
                  全選
                </button>
                <button type="button" className="btn btn-outline" style={{ padding: '2px 6px', fontSize: '0.75rem', minHeight: 'auto' }} onClick={selectAdultsOnly}>
                  僅大人
                </button>
                <button type="button" className="btn btn-outline" style={{ padding: '2px 6px', fontSize: '0.75rem', minHeight: 'auto' }} onClick={clearBeneficiaries}>
                  清空
                </button>
              </div>
            </div>

            <div className="member-grid">
              {members.map(m => {
                const isChecked = beneficiaryIds.includes(m.id);
                const shareAmt = splitShares[m.id];
                return (
                  <div
                    key={m.id}
                    className={`member-chip ${isChecked ? 'selected' : ''}`}
                    onClick={() => toggleBeneficiary(m.id)}
                    style={{ flex: '1 1 calc(50% - 8px)', justifyContent: 'space-between' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {isChecked ? <CheckSquare size={16} color="var(--primary)" /> : <Square size={16} color="var(--text-muted)" />}
                      <span>{m.name}</span>
                      <span className={`badge ${m.type === 'adult' ? 'badge-adult' : 'badge-child'}`} style={{ fontSize: '0.65rem' }}>
                        {m.type === 'adult' ? '大' : '小'}
                      </span>
                    </div>

                    {isChecked && shareAmt !== undefined && (
                      <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--primary)' }}>
                        ${shareAmt}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Weighted inputs if weighted splitType */}
          {splitType === 'weighted' && (
            <div className="card" style={{ background: 'var(--primary-light)', padding: '12px', marginBottom: '14px' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: '600', marginBottom: '6px' }}>
                ⚖️ 權重設定（大人 1 份、小孩 0.5 份）：
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {members.filter(m => beneficiaryIds.includes(m.id)).map(m => (
                  <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.8rem', flex: 1 }}>{m.name}:</span>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      className="form-control"
                      style={{ width: '64px', padding: '4px 6px', fontSize: '0.8rem' }}
                      value={customShares[m.id] !== undefined ? customShares[m.id] : (m.type === 'child' ? 0.5 : 1)}
                      onChange={e => handleCustomShareChange(m.id, e.target.value)}
                    />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>份</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Custom amounts if custom splitType */}
          {splitType === 'custom' && (
            <div className="card" style={{ background: 'var(--primary-light)', padding: '12px', marginBottom: '14px' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: '600', marginBottom: '6px' }}>
                ✏️ 輸入個別成員負擔金額：
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {members.filter(m => beneficiaryIds.includes(m.id)).map(m => (
                  <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '0.85rem', flex: 1 }}>{m.name}</span>
                    <input
                      type="number"
                      className="form-control"
                      style={{ width: '100px', padding: '4px 8px' }}
                      placeholder="0"
                      value={customShares[m.id] || ''}
                      onChange={e => handleCustomShareChange(m.id, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Date & Notes */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div className="form-group">
              <label className="form-label">日期</label>
              <input
                type="date"
                className="form-control"
                value={date}
                onChange={e => setDate(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">備註 (選填)</label>
              <input
                type="text"
                className="form-control"
                placeholder="如：現金付清"
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
            <button type="button" className="btn btn-secondary btn-block" onClick={onClose}>
              取消
            </button>
            <button type="submit" className="btn btn-primary btn-block">
              儲存消費紀錄
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
