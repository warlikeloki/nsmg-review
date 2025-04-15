document.addEventListener('DOMContentLoaded', function() {
    const eventList = document.getElementById('event-list');
    const events = Array.from(eventList.getElementsByClassName('event'));
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
  
    const upcomingEvents = [];
  
    events.forEach(event => {
      const eventDateString = event.getAttribute('data-event-date');
      if (eventDateString) {
        const eventDate = new Date(eventDateString);
        eventDate.setHours(0, 0, 0, 0);
        if (eventDate >= currentDate) {
          upcomingEvents.push({ event: event, date: eventDate });
        } else {
          event.classList.add('hidden-event');
        }
      }
    });
  
    upcomingEvents.sort((a, b) => a.date - b.date);
  
    const numberOfEventsToShow = 5;
    upcomingEvents.forEach((item, index) => {
      if (index >= numberOfEventsToShow) {
        item.event.classList.add('hidden-event');
      } else {
        item.event.classList.remove('hidden-event');
      }
    });
  });