import React, { useState } from 'react'
import { Badge } from "antd";
import { Link } from 'react-router-dom'
import style from './style.module.scss'

const General16 = ( { id, isRevoked, isFavourite, isExpired, image, name, date } ) => {
  const [favourite, setFavourite] = useState( isFavourite )

  const setIsFavourite = e => {
    e.preventDefault()
    setFavourite( !favourite )
  }

  return (
    <div className="card overflow-hidden">
      <div hidden={!isRevoked} className={style.revoked}>
        REVOKED
      </div>
      <div hidden={!isExpired} className={style.expired}>
        EXPIRED
      </div>
      <div hidden={isExpired || isRevoked} className={style.active}>
        ACTIVE
      </div>
      <div className="card-body">
        <a
          role="menuitem"
          className={`${style.favourite} ${favourite ? 'text-success' : 'text-gray-3'}`}
          onClick={setIsFavourite}
          onKeyPress={setIsFavourite}
          tabIndex="0"
        >
          {" "}
        </a>
        <div className={`${style.image} border-bottom height-150 mb-3`}>
          <img className="img-fluid clickable" src={image} alt={name} />
        </div>
        <div className="row mb-2">
          <div className="col-xl-4 col-lg-4">
            <div className="font-size-10 font-weight-bold text-dark">Created</div>
            <div className="font-size-11">{date}</div>
          </div>
          <div className="col-xl-4 col-lg-4">
            <div className="font-size-10 font-weight-bold text-dark">Expires</div>
            <div className="font-size-11">{date}</div>
          </div>
          <div className="col-xl-4 col-lg-4">
            <div className="font-size-10 font-weight-bold text-dark text-center">Credentials</div>
            <div className="font-size-11 text-center">
              <Badge count="12" style={{ backgroundColor: '#AAA' }} />
            </div>
          </div>
        </div>
        <div className="border-top pt-3">
          <Link className="text-dark font-size-14" to={`/did/resolve/${id}`}>
            {id}
          </Link>
        </div>
      </div>
    </div>
  )
}

export default General16
