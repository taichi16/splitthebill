import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Receipt, Calendar, CreditCard, Users, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';
import { CATEGORIES } from './ExpenseModal';

export default function ExpenseList({ expenses, setExpenses, members, onOpenAdd, onOpenEdit, onShowToast }) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedExpId, setExpandedExpId] = useState(null);

  const memberMap = {};
  members.forEach(m => { memberMap[m.id] = m; });

  const filteredExpenses = selectedCategory === 'all'
    ? expenses
    : expenses.filter(e => e.category === selectedCategory);

  const totalAmount = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const handleDelete = (id, title) => {
    if (confirm(`確定要刪除「${title}」這筆消費嗎？`)) {
      setExpenses(expenses.filter(e => e.id !== id));
      onShowToast(`已刪除消費紀錄「${title}」`);
    }
  };

  const getCategoryInfo = (catId) => {
    return CATEGORIES.find(c => c.id === catId) || CATEGORIES[CATEGORIES.length - 1];
  };

  const toggleExpand = (id) => {
    setExpandedExpId(expandedExpId === id ? null : id);
  };

  // Helper to calculate exact itemized breakdown for a single expense
  const calculateItemizedShares = (exp) => {
    const amount = Number(exp.amount) || 0;
    const beneficiaries = exp.beneficiaryIds || [];
    const shares = {};

    if (beneficiaries.length === 0) return { shares, payerName: memberMap[exp.payerId]?.name || '未知' };

    const adultsInExp = beneficiaries.filter(id => memberMap[id]?.type === 'adult');
    const childrenInExp = beneficiaries.filter(id => memberMap[id]?.type === 'child');

    if (exp.splitType === 'equal') {
      const perHead = Math.round(amount / beneficiaries.length);
      beneficiaries.forEach(id => { shares[id] = perHead; });
    } else if (exp.splitType === 'child_fixed') {
      let childrenSum = 0;
      childrenInExp.forEach(cId => {
        const val = exp.customShares?.[cId] !== undefined ? Number(exp.customShares[cId]) : 200;
        childrenSum += val;
        shares[cId] = val;
      });
      const remain = Math.max(0, amount - childrenSum);
      const perAdult = adultsInExp.length > 0 ? Math.round(remain / adultsInExp.length) : 0;
      adultsInExp.forEach(aId => { shares[aId] = perAdult; });
    } else if (exp.splitType === 'weighted') {
      let totalW = 0;
      beneficiaries.forEach(id => {
        const m = memberMap[id];
        const w = exp.customShares?.[id] !== undefined ? Number(exp.customShares[id]) : (m?.type === 'child' ? 0.5 : 1.0);
        totalW += w;
      });
      if (totalW > 0) {
        beneficiaries.forEach(id => {
          const m = memberMap[id];
          const w = exp.customShares?.[id] !== undefined ? Number(exp.customShares[id]) : (m?.type === 'child' ? 0.5 : 1.0);
          shares[id] = Math.round(amount * (w / totalW));
        });
      }
    } else if (exp.splitType === 'custom') {
      beneficiaries.forEach(id => {
        shares[id] = Number(exp.customShares?.[id] || 0);
      });
    }

    return {
      shares,
      payerName: memberMap[exp.payerId]?.name || '未知'
    };
  };

  return (
    <div className="expense-list">
      {/* Total Overview Card */}
      <div className="card" style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #3730a3 100%)', color: '#ffffff' }}>
        <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>活動總計累積消費</div>
        <div style={{ fontSize: '2rem', fontWeight: '900', margin: '4px 0' }}>
          ${totalAmount.toLocaleString()} <span style={{ fontSize: '0.9rem', fontWeight: '400' }}>TWD</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', opacity: 0.9 }}>
          <span>共 {expenses.length} 筆消費紀錄</span>
          <span>成員總人數：{members.length} 人</span>
        </div>
      </div>

      {/* Category Filter */}
      <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '12px' }}>
        <button
          className={`btn ${selectedCategory === 'all' ? 'btn-primary' : 'btn-outline'}`}
          style={{ padding: '6px 12px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
          onClick={() => setSelectedCategory('all')}
        >
          全部 ({expenses.length})
        </button>
        {CATEGORIES.map(cat => {
          const count = expenses.filter(e => e.category === cat.id).length;
          if (count === 0 && selectedCategory !== cat.id) return null;
          return (
            <button
              key={cat.id}
              className={`btn ${selectedCategory === cat.id ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '6px 12px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.name} ({count})
            </button>
          );
        })}
      </div>

      {/* List of Expense Cards */}
      {filteredExpenses.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
          <Receipt size={48} style={{ opacity: 0.4, marginBottom: '12px' }} />
          <p style={{ fontWeight: '600' }}>尚無消費紀錄</p>
          <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>點擊右下角 + 按鈕新增第一筆消費紀錄吧！</p>
        </div>
      ) : (
        filteredExpenses.map(exp => {
          const catInfo = getCategoryInfo(exp.category);
          const CatIcon = catInfo.icon;
          const payer = memberMap[exp.payerId];
          const beneficiaryCount = exp.beneficiaryIds ? exp.beneficiaryIds.length : 0;
          const isExpanded = expandedExpId === exp.id;
          const { shares, payerName } = calculateItemizedShares(exp);

          return (
            <div key={exp.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: 'var(--radius-sm)',
                      background: `${catInfo.color}15`,
                      color: catInfo.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <CatIcon size={22} />
                  </div>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '1.05rem' }}>{exp.title}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Calendar size={12} /> {exp.date}
                      </span>
                      <span>•</span>
                      <span style={{ color: catInfo.color, fontWeight: '600' }}>{catInfo.name}</span>
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--primary)' }}>
                    ${Number(exp.amount).toLocaleString()}
                  </div>
                  <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end', marginTop: '4px' }}>
                    <button className="btn btn-outline" style={{ padding: '4px 8px', minHeight: 'auto' }} onClick={() => onOpenEdit(exp)}>
                      <Edit2 size={13} />
                    </button>
                    <button className="btn btn-outline" style={{ padding: '4px 8px', color: 'var(--danger)', minHeight: 'auto' }} onClick={() => handleDelete(exp.id, exp.title)}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Payer and Beneficiaries summary bar */}
              <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px dashed var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CreditCard size={14} color="var(--primary)" />
                  <span>代付：</span>
                  <span style={{ fontWeight: '700', color: 'var(--primary)' }}>{payer ? payer.name : '未知'}</span>
                </div>
                <button
                  className="btn btn-outline"
                  style={{ padding: '2px 8px', fontSize: '0.75rem', minHeight: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}
                  onClick={() => toggleExpand(exp.id)}
                >
                  <Users size={13} />
                  <span>{beneficiaryCount} 人分攤</span>
                  {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>
              </div>

              {/* Expandable Itemized Breakdown Detail */}
              {isExpanded && (
                <div style={{ marginTop: '10px', padding: '10px', background: 'var(--bg-color)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem' }}>
                  <div style={{ fontWeight: '700', color: 'var(--text-muted)', marginBottom: '6px' }}>
                    📋 本筆消費成員各自負擔金額：
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    {Object.entries(shares).map(([mId, amt]) => {
                      const m = memberMap[mId];
                      const isPayer = mId === exp.payerId;
                      return (
                        <div key={mId} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', background: 'var(--card-bg)', borderRadius: '4px', border: '1px solid var(--card-border)' }}>
                          <span>
                            {m ? m.name : mId} {isPayer ? '(代付)' : ''}
                          </span>
                          <span style={{ fontWeight: '700', color: isPayer ? 'var(--success)' : 'var(--danger)' }}>
                            ${amt}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}

      {/* FAB Floating Action Button */}
      <button className="fab" onClick={onOpenAdd} title="新增消費">
        <Plus size={28} />
      </button>
    </div>
  );
}
