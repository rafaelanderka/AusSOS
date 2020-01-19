# Overview

AussieSOS is an interactive website to spread awareness and raise funds using live data from the ongoing Australian wildfires. Pulling data directly from Australian firefighting services and using a highly responsive, JavaScript-based globe model that we created from scratch, users can drag and orientate a to-scale polygon representing the total fire area. This can be placed on any part of the globe to gain a better intuitive understanding of the scale of the fires. Immediate donation to support all affected is available.

For example: if 32,000km2 of Australia is on fire, that is twice the size of Wales. 

# The Issue in More Depth

Over the last several months (winter ‘19/’20), the nation of Australia has experienced its most devastating wildfires in recorded history. Unprecedented in scale and ferocity, to-date 11 million hectares of land has been ravished, 30 people have died and 1.25 billion animals are estimated to have been lost. Sadly, Australia is only at the start of its bushfire season, and these fires continue to threaten.

The problem, at heart, is a common one: comprehending large numbers. It is important to grasp that if 32,000 km2 of Australia is on-fire, that’s an area twice the size of Wales. When relative to locations and places familiar to a non-Australian-native, the bushfire data is much more accessible, relevant and profound. 

In our technology, we allow the user to drag a graphical representation of the total area of Australia that is currently on fire. This is supported by livestreamed and up-to-date information from the Rural New South Wales Fire Service. A donation form to take action on is also a key feature.

# Our Project

Made entirely in the front-end, before the Hackathon we all had little experience of web-dev and JavaScript. Our solution is comprised of the following:

•	JSON Data Parser: we take the data directly from the Rural Fire Service of Australia and parse this data to strip out everything except the total number of fires, and calculate the total area on fire (in km2): https://www.rfs.nsw.gov.au/fire-information/fires-near-me
•	Three.js Globe: created from scratch, a 3D, physics-enabled stylised globe. This was made in JavaScript using the Three.js library and involved many hours of research and spherical geometry!
•	Globe overlay: based on the overall combined size of the fire, a token of an equivalent scaled-down size is placed on the globe and the user can use their mouse/finger to move this token and compare its size.
•	Donate now: a direct call to action interface for donating financially to bushfire relief.

The majority of the code is written in JavaScript, with some HTML and CSS along the way too.
