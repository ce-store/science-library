The items listed below should be addressed in order to complete the
Science Library

# UI changes

1. Additional sorts for pages:
Requires updates on CE for completion

 + Venues
 by # papers (default)
 by recency (date of most recent event)
 by duration (number of years contributed)
 by # citations (total paper citations) (new properties added - event->citation count and event series->citation count)

 + Organisations
 by citation

 + Topics
 by collaborations (default)
 by # papers (new property added - topic->number of documents)
 by # authors (new property added - topic->number of authors)
 by # citations (new property added - topic->citation count)
 by name

1. Main author list page
Numbers shown in brackets should be external paper count but seem to be
external paper count + internal conference paper count?
e.g. don_towsley should be 83 but is 123?

1. Author page -> list co-authors
 + Show icons for authors to be consistent with elsewhere
 + Add checkboxes to allow authors to be filtered by types
 + Can we also show a summary list of organisations that are co-authored with

1. Icons for authors - whenever authors are rendered can we show the icon that
corresponds to their type (industrial, academic etc)

1. Hover help - can we use consistent hover help throughout when rendering text
items in lists or in tables:
 + paper - venue(s), citation(s)
 + person - organisation, # papers and # local citations
 + organisation - # authors, # papers and # local citations
 + venue - # authors, # papers and # local citations
 + topic - # authors, # papers and # local citations

1. Topic details page
 + Add list of venues where that topic is published (showing relative size)

1. Topics on non-topic pages
 + Add list of related topics to paper details page
 + Add list of related topics to author details page (showing relative size of topics)
 + Add list of related topics to organisation details page (showing relative size of topics)
 + Add list of related topics to venue details page (showing relative size of topics)

1. Venue details page
Can we show numbers in brackets for Papers, Organisations, Authors - it's hard
to immediately see how many may be in each area, especially for the ACITA events.

1. Remove old code
e.g. some queries are marked as "not used".  I've removed them from SL_data
and everything still works so I think the ScienceLibrary JS can be removed too.

# Model related

1. Integrating Legacy text

1. Code up title/colours/other hardcoded text in CE

1. Remove *organisation->type*
Currently contains ‘GOV’, ‘IND’ etc.  But the organisation type can be obtained
by seeing if the instance is a concept named `government organisation`,
`academic organisation` etc.
Also, the same logic applies to people: they will be `government person`,
`industry person` etc, saving the need to navigate back to the organisation to
check

1. Rename *document->original authors string* to *full author list* (done in CE)

1. Rename *document->old venue* to *venue details* (done in CE)
Also, this should always be shown (unless empty) even when `venue` is also
present.
Venue details can contain additional information.

1. *document->weight* is not being calculated correctly in compute.js

1. Add new *programme* concept and property to link documents to specific
programmes. (Dave)

1. Implement new relationship between individuals and papers so that they
can have a different organisation for each individual paper.
See document *ScienceLibrary/doc/ScienceLibrary - model fixes v1.0.docx* for
details if needed.

# Performance related

1. On the authors list page the HTTP request to execute the query
"published person citations" seems to get called twice?

1. On the co-authors wheel page the following HTTP requests for queries seem to
be made twice: "person details", "published person -> organisation",
"person -> document"

1. Try to minimise JSON volumes for pages (Dave)
Review each request and try to minimize size by specifying only the required
properties to be returned

# Hudson

1. Add *help* mode
Can be a hardcoded response but should be shown if you say *help* or something
Note that the keyword search has been updated to support quoted values, AND, OR
and NOT operators (with AND being the default), e.g.
"Controlled English +Gain -"Information Fabric"

1. Add *list* commands
e.g. * list papers *, *list government papers* etc, showing a list of instances
based on simple matching to a concept

---------------------

# Done

# UI bugs

1. On author scatter clicking the checkboxes gives a JS error:
`scatter-chart.js:177`
`Uncaught ReferenceError: scatterYAxisNames is not defined`

1. Collaborations between authors page gives JS error:
`angular.js:12783`
`TypeError: d[name].sort is not a function`
e.g http://localhost:3000/collaboration?author=ting_he&author=don_towsley

1. On the homepage change 'Total (External)' to be the total count of external
publications (journals + external conferences + patents).
This isn't really a bug but a change, but I just don't agree with ARL that
patents should not be included in that count as it looks like it just doesn't
add up.

# UI changes

1. Default sort no longer working on paper page
(is sorting alphabetically)

1. Additional sorts for pages:
 + Papers
 by collaborations (default)
 by # citations
 by date (most recent first)
 by name
 + Authors
 by # external papers (default)
 by # ITA citations
 by # ITA h-index
 by # co-authors
 by name
 + Venues
 by name
 + Organisations
 by # authors (default)
 by # papers
 by # citations (new property added - organisation->citation count)
 by name
 + Topics
 by # papers (new property added - topic->number of documents)
 by name

1. Add the numbers in brackets back for the items listed in the previous step
if the underlying data is numeric (except for collaborations which comes from
`weight` and won't make any sense)

1. Remove comment and issue code from JS

1. In the authors scatter chart provide a toggle to switch between *local*
citation data and *google* citation data (e.g. *local h-index* and *local
citation count* on the *person* instance vs the corresponding data on the
related google scholar citation instance)

1. On the authors scatter chart is it possible to show all the authors hidden
under a single dot when they are stacked, e.g. on hover?

1. Home page - can we add a line/separator after Patents and before Internal
Conferences.
I want to reinforce the split between internal and external papers.

1. On the author narrative is it possible to use the standard paper icon instead
of the grey blob?
This would then be consisted with everywhere else we list papers...

1. On the authors page provide a switch/option to show google scholar citations
data as well as the local citations.
Perhaps show both if both available? (or allow a click to switch between them)

1. If a document has a *status* that does not match 'accepted' then:
 + in the list view precede the title with *[submitted]* (or whatever the status is)
 + in the details view add a prominent message showing the non-accepted status

1. Author page -> co-authors chart
Allow the type that the author is (e.g. blue/academic for Don Towsley) to be
deselected but continue to render the author whos page this is.
It is quite handy to find who an author co-authors with outside of their own type.

1. Author page -> list papers
Provide the same sort options as for the overall papers home page

1. Author page -> list co-authors
 + Default sort should be *number of co-authored papers* but also allow sorting
by name
 + Show number of co-authorships in brackets after author name

1. Organisation page -> list papers
Provide the same sort options as for the overall papers home page
Add author sorting on organisation detail page

1. Topic details page
 + Add list of authors who write on that topic (showing relative size)
 + Add list of organisations who write on that topic (showing relative size)

# Hudson

1. Implement keyword search as part of Hudson
Use the existing ce-store keyword search API as is and simply hardcode a list of
concepts and properties in JS that could be rendered.
e.g. to test the api yourself simply use the engineering panel "search" box to
search for "Gaian" or "Controlled English" and you can see that concept/property
matches worth listing in the UI would be:
`document->abstract`
`document->title`
`topic`
`person`
`organisation`
...all others can probably simple be filtered out in JS for now.  In the future
we may want to add new meta-model concepts for "searchable thing" and mark
specific CE concepts and properties as searchable, but for now it seems to work
fine if we use it as is.
