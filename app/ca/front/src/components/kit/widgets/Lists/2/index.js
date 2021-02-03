import React from 'react'
import style from './style.module.scss'

const List2 = () => {
  return (
    <div className="text-gray-6 p-3">
      <ul className="list-unstyled">
        <li className="mb-3">
          <div className={style.head}>
            <p className={style.title}>
              Update Status:
              <strong className="text-black"> New</strong>
            </p>
            <time className={style.time}>5 min ago</time>
          </div>
          <p>Mary has approved your quote.</p>
        </li>
        <li className="mb-3">
          <div className={style.head}>
            <p className={style.title}>
              Update Status:
              <strong className="text-danger"> Rejected</strong>
            </p>
            <time className={style.time}>15 min ago</time>
          </div>
          <p>Mary has declined your quote.</p>
        </li>
        <li className="mb-3">
          <div className={style.head}>
            <p className={style.title}>
              Payment Received:
              <strong className="text-black"> $5,467.00</strong>
            </p>
            <time className={style.time}>15 min ago</time>
          </div>
          <p>GOOGLE, LLC AUTOMATED PAYMENTS PAYMENT</p>
        </li>
        <li className="mb-3">
          <div className={style.head}>
            <p className={style.title}>
              Notification:
              <strong className="text-danger"> Access Denied</strong>
            </p>
            <time className={style.time}>5 Hours ago</time>
          </div>
          <p>The system prevent login to your account</p>
        </li>
        <li className="mb-3">
          <div className={style.head}>
            <p className={style.title}>
              Payment Received:
              <strong className="text-black">$55,829.00</strong>
            </p>
            <time className={style.time}>1 day ago</time>
          </div>
          <p>GOOGLE, LLC AUTOMATED PAYMENTS PAYMENT</p>
        </li>
        <li className="mb-3">
          <div className={style.head}>
            <p className={style.title}>
              Notification:
              <strong className="text-danger"> Access Denied</strong>
            </p>
            <time className={style.time}>5 Hours ago</time>
          </div>
          <p>The system prevent login to your account</p>
        </li>
      </ul>
    </div>
  )
}

export default List2
