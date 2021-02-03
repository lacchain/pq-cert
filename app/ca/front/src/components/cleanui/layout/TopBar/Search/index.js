import React, { useEffect, useState } from 'react'
import { injectIntl } from 'react-intl'
import { withRouter } from 'react-router-dom'
import { SearchOutlined } from '@ant-design/icons'
import { Input } from 'antd'
import style from './style.module.scss'

let searchInput = null

const Search = ({ intl: { formatMessage }, history }) => {
  const [showSearch, setShowSearch] = useState(false)
  const [searchText, setSearchText] = useState('')

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown, false)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  })

  const showLiveSearch = () => {
    setShowSearch(true)
    setTimeout(() => {
      searchInput.focus()
    }, 100)
  }

  const changeSearchText = e => {
    setSearchText(e.target.value)
  }

  const hideLiveSearch = () => {
    searchInput.blur()
    setShowSearch('')
    setSearchText('')
  }

  const handleKeyDown = event => {
    if (showSearch) {
      const key = event.keyCode.toString()
      if (key === '27') {
        hideLiveSearch()
      }
      if (key === '13') {
        hideLiveSearch()
        history.push(`/did/resolve/${searchText}`)
      }
    }
  }

  const handleNode = node => {
    searchInput = node
  }

  return (
    <div className="d-inline-block mr-4">
      <Input
        className={style.extInput}
        placeholder={formatMessage({ id: 'topBar.typeToSearch' })}
        prefix={<SearchOutlined style={{ color: 'rgba(0,0,0,.25)' }} />}
        style={{ width: 400 }}
        onFocus={showLiveSearch}
      />
      <div
        className={`${
          showSearch ? `${style.livesearch} ${style.livesearchVisible}` : style.livesearch
        }`}
        id="livesearch"
      >
        <button className={style.close} type="button" onClick={hideLiveSearch}>
          <i className="icmn-cross" />
        </button>
        <div className="container-fluid">
          <div className={style.wrapper}>
            <input
              type="search"
              className={style.searchInput}
              value={searchText}
              onChange={changeSearchText}
              id="livesearchInput"
              placeholder="did:ethr:lacchain:"
              ref={handleNode}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default withRouter(injectIntl(Search))
