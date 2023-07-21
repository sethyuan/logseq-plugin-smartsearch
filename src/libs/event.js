export default class EventEmitter {
  events = {}

  on(eventName, handler) {
    if (this.events[eventName] == null) {
      this.events[eventName] = []
    }
    this.events[eventName].push(handler)
  }

  off(eventName, handler) {
    if (this.events[eventName] == null) return
    const index = this.events[eventName].indexOf(handler)
    if (index > -1) {
      this.events[eventName].splice(index, 1)
    }
  }

  async emit(eventName, data) {
    if (!this.events[eventName]?.length) return
    for (const handler of this.events[eventName]) {
      await handler(data)
    }
  }
}
