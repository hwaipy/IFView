export default () => {
  const logHello = () => {
    console.log('hello')
  }

  if (document.readyState === 'complete') {
    logHello()
  } else {
    window.addEventListener('load', logHello, { once: true })
  }
}
