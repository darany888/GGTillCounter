import React from 'react';

interface DenominationProps {
    symbol: string;
    denomination: number;
    count: number;
    rowTotal: number; 
    regex: string; 
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onBlur: () => void;
}

const Denomination = (props: DenominationProps): JSX.Element => {
    const { symbol, denomination, count, rowTotal, onChange, onBlur } = props;
    const id = `denom-${denomination}`;

    return (
        <div className="denomination">
            {/* 1. Denomination Label (Column 1) */}
            <p>{symbol}{denomination.toFixed(2)}</p>
            
            {/* 2. Count Input Field (Column 2) */}
            <input
                type="number" 
                id={id}
                defaultValue={count > 0 ? count.toString() : ''}
                onChange={onChange}
                onBlur={onBlur}
                min="0" 
                step="1" 
            />

            {/* 3. Row Total Display (Column 3) */}
            <span className="row-total">
                {symbol}
                {rowTotal.toFixed(2)}
            </span>
        </div>
    );
};

export default Denomination;